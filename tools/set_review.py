#!/usr/bin/env python3
"""
How unidentified set items show on the ground, per base and filter level (sections/170-sets.filter), for the author's
review on a page (2026-10-31: many set items hidden on filter levels 5-12 should show their plain name on 5-7 and
hide from 8):

    python tools/set_review.py           write tools/set_review.html (gitignored), published as a claude.ai page whose
                                         db holds the author's choices

One card per set base (unidentified, the filter can't tell the items on one base apart: Infernal Cranium / Sander's
Paragon): what it shows today on every filter level (tools/tier_map.py's engine on the filter's own rules, Erazure -
Main, outside town, an item you have discovered), split by ethereal and character level where today's rules split it,
and a grid of the same shape the author paints with a display (look, minimap icon, chat line, drop sound). A card can
also split by ethereal or at other character levels, take its own drop sound and say what an undiscovered item does.
Beside it: each item's set, required level, how often it drops in a map (the Grail Planner's numbers: rare T1-T3 maps,
300% magic find, no ear) and its asking price on the trade site (tools/market_tiers.py's cache, when fetched).
The cards are grouped by set (the author, 2026-10-31), one tab per tier (TIERS: the wiki's common, uncommon and
class-focused sets, Sander's Folly with the common ones), the sets by level; a base two sets share shows under both,
one choice for both, and the set rings and amulets have a tab of their own (one card each, every set's piece links it).

The page's db: collection `cards`, one document per card id (`SET_cap`): {eth: bool, cuts: [character levels a new
row starts at], rows: {"<a|n|e>|<from level>": [13 display ids, filter levels 0-12]}, sound, grail: "grail" /
"same", note, savedAt}; collection `meta`, documents `displays` ({list: [{id, look, icon, chat, sound}]}, the displays
the author added) and `note` ({text}). Display ids: DISPLAYS below, then the author's own ("c1"...). Apply only when
the author says: the choices go into 170's rules by hand.
"""
import argparse
import datetime
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import tier_map as T  # noqa: E402

ROOT = T.ROOT
TEMPLATE = ROOT / "tools" / "set_review_template.html"
PAGE = ROOT / "tools" / "set_review.html"
PAGE_URL = "https://claude.ai/artifact/C4YY1V9E5LDvW1xwXA57vQ"  # db: cards/<id>, meta/displays, meta/note
ALIASES = ROOT / "sections" / "040-aliases.filter"
GRAIL_PAGE = ROOT / "Erazure-Grail-Planner.html"
GRAIL_RATES = ("rare", 300, [("1", 10), ("2", 10), ("3", 9)])  # rare T1-T3 maps (10, 10 and 9 maps), 300% MF

# The minimap icons 170 uses: (BORDER, MAP, DOT, PX) palette codes
ICONS = {
    "none": ("No icon", ()),
    "value": ("Value icon", (("71", "76", "84", "20"),)),
    "set": ("Set icon", (("71", "76", "7D", "84"),)),
    "small": ("Small icon", ((None, "71", "76", "81"),)),
    "small84": ("Small icon, red centre", ((None, "71", "76", "84"),)),
    "lld": ("Low Level Duel icon", (("71", "C5", "9F", "A2"),)),
    "grail": ("Grail icon", (("71", "76", "7D", "69"),)),
}
# The looks: tier_map's look key -> (page name, the label's alias pair or None)
LOOKS = {
    "SET_HIGH_VALUE": ("High value", "SET_HIGH_VALUE"),
    "SET_MEDIUM_VALUE": ("Medium value", "SET_MEDIUM_VALUE"),
    "SET": ("Set look", "SET"),
    "DECORATED": ("Dimmer set look", "SET_NORMAL"),
    "SET_LLD": ("Low Level Duel", "SET_LLD"),
    "SET_GRAIL": ("Grail look", "SET_GRAIL"),
    "NAME": ("Plain name", None),
    "HIDDEN": ("Hidden", None),
}
# The displays the page starts with (today's combinations): id -> (look, icon, chat, own drop sound, short label)
DISPLAYS = [
    ("high", "SET_HIGH_VALUE", "value", True, True, "High"),
    ("medium", "SET_MEDIUM_VALUE", "value", True, True, "Med"),
    ("set", "SET", "set", True, False, "Set"),
    ("set_small_chat", "SET", "small84", True, False, "Set·s"),
    ("set_quiet", "SET", "small", False, False, "Set·q"),
    ("dim_quiet", "DECORATED", "small", False, False, "Dim·q"),
    ("lld", "SET_LLD", "lld", True, False, "LLD"),
    ("name", "NAME", "none", False, False, "Name"),
    ("hidden", "HIDDEN", "none", False, False, "—"),
]
SOUNDS = [2585, 2594]  # the value tiers' drop sounds (armor and jewelry / weapons)
# The page's tabs of sets (the author, 2026-10-31), from the wiki's set pages: Normal lists the common sets, Exceptional
# the uncommon ones, Elite the class-focused ones
TIERS = [("common", "Common sets"), ("uncommon", "Uncommon sets"), ("class", "Class-focused sets")]
TIER_PAGES = {"Normal": "common", "Exceptional": "uncommon", "Elite": "class"}
TIER_MOVES = {"Sander's Folly": "common"}  # the author: with the common sets, though the wiki lists it as uncommon


def alias_segments():
    """{alias: [[color, text]]} of 040's SET_*_LEFT / _RIGHT (Main's)."""
    out = {}
    for line in ALIASES.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^Alias\[(SET_(?:[A-Z_]+_)?(?:LEFT|RIGHT))\]:(.*)$", line)
        if not m:
            continue
        segs, color, pos, text = [], "GREEN", 0, m.group(2)
        for c in T.COLOR_RE.finditer(text):
            if c.start() > pos:
                segs.append([color, text[pos:c.start()]])
            color, pos = c.group(1), c.end()
        if pos < len(text):
            segs.append([color, text[pos:]])
        out[m.group(1)] = segs
    return out


def display_of(key, level):
    """A display id for today's outcome (look, chat, sound, icons), or None. Level 0 shows every notification's chat
    line (%TIER-0% included), so there the chat line is left out of the match."""
    look, chat, sound, icons = key
    icon = next((k for k, (_, layers) in ICONS.items() if tuple(layers) == tuple(icons)), None)
    if icon is None:
        return None
    hits = [d for d in DISPLAYS if d[1] == look and d[2] == icon and d[4] == bool(sound)
            and (level == 0 or d[3] == chat)]
    if level == 0 and len(hits) > 1:
        hits = [d for d in hits if not d[3]] or hits
    return hits[0][0] if hits else None


def grail_data():
    """{set item name: drops per map} from the Grail Planner page's data (rare T1-T3 maps, 300% MF, no ear)."""
    try:
        text = GRAIL_PAGE.read_text(encoding="utf-8")
        data, _ = json.JSONDecoder().raw_decode(text[text.index("const DATA = ") + len("const DATA = "):])
    except (OSError, ValueError):
        return {}, None
    kind, mf, tiers = GRAIL_RATES
    total = sum(w for _, w in tiers)
    lo, hi = data.get("rateRange") or (0, 1)

    def rate(s, i):  # grail_map.pack_rates: 3 base-36 characters a rate, the log10 over rateRange (a list: per 1,000 maps)
        if isinstance(s, list):
            return s[i] / 1000
        c = int(s[3 * i:3 * i + 3], 36)
        return 10 ** (lo + (c - 1) * (hi - lo) / (36 ** 3 - 2)) if c else 0.0
    out = {}
    for i, it in enumerate(data["items"]):
        if it["kind"] == "SET":
            out[it["name"]] = sum(rate(data["rates"][f"{t}|{kind}|{mf}"]["none"], i) * w / total for t, w in tiers)
    return out, data.get("date")


def market_data():
    """({(name, code): {sc: {n, med}, hc: ...}}, fetched date) from market_tiers' cache, or ({}, None)."""
    try:
        import market_tiers as M
        markets = {mode: M.load_listings(mode)[0] for mode in M.MODES}
    except (SystemExit, OSError, ValueError):
        return {}, None
    out = defaultdict(dict)
    for mode, by_item in markets.items():
        for (kind, name), ls in by_item.items():
            if kind != "SET":
                continue
            for code in {x["code"] for x in ls}:
                s = M.summary([x for x in ls if not x["cor"] and x["code"] == code])
                if s["n"]:
                    out[(name, code)][mode] = {"n": s["n"], "med": s["med"]}
    fetched = [M.read_meta().get(m, {}).get("fetched") for m in M.MODES]
    return out, min((f for f in fetched if f), default=None)


def today_rows(g, table, others):
    """{"a" / "n" / "e": {from character level: [display id per filter level]}} of one table (LOC field, one grail
    state); an outcome no display matches gets an id of its own in `others`."""
    dims = g.dims
    ei, ci, fi = dims.index["ETH"], dims.index["CLVL"], dims.index["FILTLVL"]
    by = defaultdict(lambda: defaultdict(dict))
    for sc, k in table.items():
        did = display_of(k, sc[fi])
        if did is None:
            did = others.setdefault(k, f"x{len(others) + 1}")
        by[sc[ei]][sc[ci]][sc[fi]] = did
    out = {}
    for eth, by_clvl in by.items():
        runs, last = {}, None
        for clvl in sorted(by_clvl):
            levels = [by_clvl[clvl][lv] for lv in T.FILTER_LEVELS]
            if levels != last:
                runs[1 if not runs else clvl] = levels
                last = levels
        out[eth] = runs
    if len(out) == 2 and out[0] == out[1]:
        return {"a": out[0]}
    if len(out) == 1:
        return {"a": next(iter(out.values()))}
    return {"n": out[0], "e": out[1]}


def cards():
    groups, _, _, _ = T.analyse()
    main = {t: 0 for t in T.TOGGLES}
    sounds = T.load_sounds()
    drops, grail_date = grail_data()
    prices, fetched = market_data()
    others = {}  # outcomes no display of DISPLAYS matches: key -> id
    out = []
    for g in groups:
        if g.kind != "SET":
            continue
        table = T.variant_table(g, main)
        found = T.restrict(table, g.dims, {"LOC": "field", "GRAIL": "found"})
        new = T.restrict(table, g.dims, {"LOC": "field", "GRAIL": "new"}) if "new" in g.dims.values["GRAIL"] else {}
        base = g.base or {}
        weapon = "WEAPON" in g.groups
        today = today_rows(g, found, others)
        tsound = next((k[2] for k in found.values() if k[2]), 0)
        undiscovered = sorted({k[0] for k in new.values()})
        view = T.item_view(g, main, sounds)
        items = []
        for name, set_name in dict.fromkeys((it["name"], it["set"]) for it in g.items):
            items.append({"name": name, "set": set_name, "drop": round(drops[name], 5) if name in drops else None,
                          "price": prices.get((_norm(name), g.code), {})})
        jewelry = g.code in ("rin", "amu")
        out.append({
            "id": f"SET_{g.code}", "code": g.code, "base": base.get("name", g.code),
            "tier": "" if jewelry else T.TIER_NAMES.get(base.get("tier"), ""), "category": g.category,
            "jewelry": jewelry, "canEth": bool(base.get("eth")),
            "items": items, "today": today, "sound": tsound or (2594 if weapon else 2585),
            "todaySound": tsound, "undiscovered": [T.LOOKS[lk][0] for lk in undiscovered],
            "lines": view["lines"], "notes": view["notes"],
        })
    req = {(it["name"], it["code"]): it["lvlreq"] for it in T.pd2_data.load_items() if it["kind"] == "SET"}
    for c in out:
        for it in c["items"]:
            it["req"] = req.get((it["name"], c["code"]))
    order = {"": 0, "Normal": 1, "Exceptional": 2, "Elite": 3}
    out.sort(key=lambda c: (order.get(c["tier"], 4), T.CATEGORY_ORDER.index(c["category"])
                            if c["category"] in T.CATEGORY_ORDER else 99, c["base"]))
    extra = [{"id": i, "look": k[0], "icon": next((n for n, (_, ls) in ICONS.items() if tuple(ls) == tuple(k[3])),
                                                   "none"), "chat": k[1], "sound": bool(k[2])} for k, i in others.items()]
    return out, extra, {"grail": grail_date, "market": fetched}


def _norm(name):
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


def set_groups(cards):
    """[{name, tier, items: [{name, card}], req: [lowest, highest], avg}] in the page's order: the tabs' tiers, in each
    its sets by their items' average required level (the wiki's order on a tie), each set's items in the wiki's order.
    Fills in the cards' item set names the wiki spells otherwise (Infernal Spire (Infernal Torch))."""
    import item_data
    norm = T.pd2_data.norm_name
    by_name = {norm(it["name"]): (c, it) for c in cards for it in c["items"]}
    sets, missing = {}, []
    for wi in item_data.items():
        if wi["kind"] != "SET" or wi["page"] not in TIER_PAGES:
            continue
        name = wi.get("display", wi["name"])
        hit = by_name.get(norm(name)) or by_name.get(norm(re.sub(r"\s*\(.*\)$", "", name)))
        if not hit:
            missing.append(name)
            continue
        card, it = hit
        it["set"] = it["set"] or wi["set"]
        s = sets.setdefault(wi["set"], {"name": wi["set"], "tier": TIER_MOVES.get(wi["set"], TIER_PAGES[wi["page"]]),
                                        "items": []})
        if all(x["name"] != it["name"] for x in s["items"]):
            s["items"].append({"name": it["name"], "card": card["id"], "req": it["req"]})
    covered = {x["card"] for s in sets.values() for x in s["items"]}
    missing += [c["base"] for c in cards if c["id"] not in covered]
    if missing:
        sys.exit("set_review: not on the wiki's set pages: " + ", ".join(missing))
    order = {t: i for i, (t, _) in enumerate(TIERS)}
    out = []
    for i, s in enumerate(sets.values()):
        reqs = [x.pop("req") for x in s["items"] if x["req"] is not None]
        s["req"] = [min(reqs), max(reqs)] if reqs else None
        s["avg"] = round(sum(reqs) / len(reqs), 1) if reqs else 99
        out.append((order[s["tier"]], s["avg"], i, s))
    return [s for *_, s in sorted(out, key=lambda x: x[:3])]


def write_page(rows, extra, dates):
    data = {
        "generated": datetime.date.today().isoformat(), "levels": T.load_levels(),
        "palette": T.load_palette(), "aliases": alias_segments(),
        "looks": {k: {"name": n, "alias": a} for k, (n, a) in LOOKS.items()},
        "icons": {k: {"name": n, "layers": [list(x) for x in ls]} for k, (n, ls) in ICONS.items()},
        "displays": [{"id": i, "look": lk, "icon": ic, "chat": ch, "sound": so, "short": sh}
                     for i, lk, ic, ch, so, sh in DISPLAYS] + extra,
        "sounds": [{"id": s, "name": T.load_sounds().get(s, {}).get("name", str(s))} for s in SOUNDS],
        "dates": dates, "nameMax": T.BH_NAME_MAX, "tiers": [{"id": t, "name": n} for t, n in TIERS],
        "sets": set_groups(rows), "cards": rows,
    }
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = TEMPLATE.read_text(encoding="utf-8")
    PAGE.write_text(html.replace("/*__DATA__*/null", blob), encoding="utf-8", newline="\n")
    print(f"wrote {PAGE.relative_to(ROOT)} ({PAGE.stat().st_size // 1024} KB, {len(rows)} cards"
          + (f", {len(extra)} displays not in DISPLAYS" if extra else "") + ")")


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    argparse.ArgumentParser(description=__doc__.split("\n\n")[0]).parse_args()
    rows, extra, dates = cards()
    write_page(rows, extra, dates)
    return 0


if __name__ == "__main__":
    sys.exit(main())
