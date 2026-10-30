#!/usr/bin/env python3
"""The value tiers of unique and set items against the trade site's prices: the author's review page of the tier each
unique and set base gets (tools/tier_map.py's tiers, Erazure - Main) beside what its items are listed for on the PD2
trade site, softcore and hardcore ladder apart, with a suggested tier where both markets disagree with the filter.

    python tools/market_tiers.py --fetch       fetch the trade site's active ladder listings of unique and set items,
                                               softcore and hardcore, into tools/.cache/market/ (gitignored; about
                                               75,000 listings, one request of 250 a second: 5-6 minutes)
    python tools/market_tiers.py               write tools/market_tiers.html (gitignored) from
                                               tools/market_tiers_template.html and the cached listings: one card per
                                               base, published as a claude.ai page whose db keeps the author's decisions
    python tools/market_tiers.py --report      print the suggestions instead
    python tools/market_tiers.py --item NAME   print the rows of the bases an item is on, with each item's prices

The trade site (https://www.projectdiablo2.com/market) has no documented API, but its backend answers anonymous GETs,
https://api.projectdiablo2.com/market/listing with filters (`item.quality.name`, `is_ladder`, `is_hardcore`,
`$select[]` of nested fields, at most 250 per request); Roofoo's filter polls it the same way. Prices are what
sellers ask on listings nobody has bought (the site keeps sold listings for about 13 hours only): free text such as
"15 wss", ".25 obo", "gul", read as WSS with 1 HR = 100 WSS, as the listings themselves equate them. A bare fraction
(.25, 1.5) is HR; a bare whole number up to 10 ("2") is HR or WSS, whichever is nearer the item's other listings (on
junk, "2" means 2 WSS). A price the parser can't read ("offer", trades) is left out.

A base's price in one market is its best item's middle price (median) over its identified, uncorrupted listings, from
items with MIN_LISTINGS or more; a seller's copies of one item at one price count once. A base the filter tiers
differently when ethereal gets two rows, non-ethereal and ethereal listings apart; otherwise both count. Each market's
price bands come from the filter's own tiers: a tier's middle price over its bases, the cut between two tiers their
geometric mean (sets have no Minimal tier: there it is no tier). A raise or lower needs both markets to put the base
above (or below) its tier, then goes to the nearer of the two; a market with too few listings leaves the other alone,
a weak suggestion. Low Level Duel and Diablo Clone & Rathma are not judged by price.

The page's db (collection `decisions`, one document per row id, `UNI_7cr` / `UNI_amd_eth`) holds the author's
choice per base: {choice: take / keep / other, tier, note, savedAt, data}; the tier rules are in 160 / 170
(tier_map.py names the alias each tier uses).
"""
import argparse
import datetime
import json
import math
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import tier_map as T  # noqa: E402

ROOT = T.ROOT
CACHE = ROOT / "tools" / ".cache" / "market"
META = CACHE / "meta.json"
TEMPLATE = ROOT / "tools" / "market_tiers_template.html"
PAGE = ROOT / "tools" / "market_tiers.html"

API = "https://api.projectdiablo2.com/market/listing"
USER_AGENT = "PD2-Loot-Filter market_tiers.py (github.com/FiltersBy-Erazure/PD2-Loot-Filter)"
MODES = {"sc": ("Softcore ladder", "false"), "hc": ("Hardcore ladder", "true")}
PER_REQUEST = 250  # the API's most
DELAY = 1.0  # seconds between requests
FIELDS = ["_id", "price", "hr_price", "user_id", "created_at", "item.name", "item.base_code", "item.is_ethereal",
          "item.corrupted", "item.is_identified", "item.quality"]
MIN_LISTINGS = 5

# A listing priced in runes: the fixed values Roofoo's filter uses (scripts/update-pd2trader-runes.mjs), in HR; other
# runes are left out
RUNE_HR = {"pul": 0.03, "um": 0.05, "mal": 0.1, "ist": 0.15, "gul": 0.25, "vex": 0.5, "sur": 1.5, "ber": 3}
NUM = r"(\d+(?:\.\d+)?|\.\d+)"
WSS_RE = re.compile(NUM + r"\s*x?\s*(?:wss|wws|ws|w\.s\.s)(?:'?s)?(?:\s+(?:obo|each|ea|firm|neg))?\.?")
HR_RE = re.compile(NUM + r"\s*(?:hr|hrs|h\.r\.?)(?:\s+(?:obo|firm|neg))?\.?")
RUNE_RE = re.compile(r"(?:(\d+)\s*x?\s*)?(" + "|".join(RUNE_HR) + r")(?:\s+rune)?(?:\s+(?:obo|firm))?")
BARE_RE = re.compile(NUM + r"(?:\s+(?:obo|firm|neg|or offer|o\.b\.o))?\.?")
BARE_MAX = 10  # a bare whole number up to this is HR or WSS (the item's other listings decide); above it, left out
WIDE = 10  # a market whose upper quartile is this many times its lower one: its price is noted as uncertain

# The tiers by the page's names (tier_map's tier groups), lowest first; sets have no Minimal tier
TIER_NAMES = {"High value": "High", "Medium value": "Medium", "Minimal value": "Minimal", "Everything else": "No tier",
              "Low Level Duel": "Low Level Duel", "Diablo Clone & Rathma": "Diablo Clone & Rathma"}
LADDER = ["No tier", "Minimal", "Medium", "High"]
SET_LADDER = ["No tier", "Medium", "High"]
UNJUDGED = {"Low Level Duel", "Diablo Clone & Rathma"}
SECTIONS = [  # suggestion kind -> the page's section (in this order)
    ("raise", "Raise", "Both markets price the base above its tier (or one market does, where the other has too few "
     "listings)."),
    ("lower", "Lower", "Both markets price the base below its tier (or one market does, where the other has too few "
     "listings)."),
    ("split", "Markets disagree", "One market agrees with the tier and the other doesn't, or they point opposite ways."),
    ("keep", "Agree", "The tier is where the prices put it."),
    ("few", "Too few listings", f"No item on the base has {MIN_LISTINGS} uncorrupted listings in either market."),
    ("unjudged", "Not judged by price", "Low Level Duel and Diablo Clone & Rathma items: their tiers aren't about "
     "trade value."),
]


# ---------------------------------------------------------------- fetching

def get(params):
    url = API + "?" + urllib.parse.urlencode(params)
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001 (any network trouble: wait and try again)
            print(f"\n  retry {attempt + 1}: {e}", file=sys.stderr)
            time.sleep(5 * (attempt + 1))
    raise SystemExit(f"the trade site doesn't answer: {url}")


def compact(listing):
    it = listing.get("item") or {}
    return {"id": listing["_id"], "user": listing.get("user_id"), "price": listing.get("price"),
            "hr": listing.get("hr_price"), "created": listing.get("created_at"), "name": it.get("name"),
            "code": it.get("base_code"), "quality": (it.get("quality") or {}).get("name"),
            "eth": bool(it.get("is_ethereal")), "id_": bool(it.get("is_identified")), "cor": bool(it.get("corrupted"))}


def read_meta():
    try:
        return json.loads(META.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def fetch(mode):
    name, hardcore = MODES[mode]
    CACHE.mkdir(parents=True, exist_ok=True)
    part = CACHE / f"{mode}.jsonl.part"
    count = 0
    with part.open("w", encoding="utf-8", newline="\n") as f:
        for quality in ("Unique", "Set"):
            skip, total = 0, None
            while total is None or skip < total:
                params = [("type", "item"), ("accepted_offer_id", "null"), ("is_ladder", "true"),
                          ("is_hardcore", hardcore), ("item.quality.name", quality), ("$sort[_id]", 1),
                          ("$limit", PER_REQUEST), ("$skip", skip)] + [("$select[]", fl) for fl in FIELDS]
                d = get(params)
                total = d["total"]
                for listing in d["data"]:
                    f.write(json.dumps(compact(listing), ensure_ascii=False) + "\n")
                    count += 1
                skip += PER_REQUEST
                print(f"\r{name}, {quality.lower()} items: {min(skip, total)} / {total}   ", end="", flush=True)
                if not d["data"]:
                    break
                time.sleep(DELAY)
            print()
    part.replace(CACHE / f"{mode}.jsonl")
    meta = read_meta()
    meta[mode] = {"fetched": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="minutes"),
                  "listings": count}
    META.write_text(json.dumps(meta, indent=1), encoding="utf-8")


# ---------------------------------------------------------------- prices

def wss(price, hr):
    """(a listing's price in WSS, True), (n, False) for a bare whole number n that may be HR or WSS, or (None, _)."""
    if isinstance(hr, (int, float)) and hr > 0:
        return hr * 100, True
    p = (price or "").strip().lower()
    if not p:
        return None, True
    p = re.sub(r"(\d),(\d)", r"\1.\2", p)  # 0,5
    first = re.split(r"\s+or\s+|/|\||,|;|\+|\(", p)[0].strip()  # "gul or 30wss", "0.2 // 20wss": the first
    m = WSS_RE.fullmatch(first)
    if m:
        return float(m.group(1)), True
    m = HR_RE.fullmatch(first)
    if m:
        return float(m.group(1)) * 100, True
    m = RUNE_RE.fullmatch(first)
    if m:
        return int(m.group(1) or 1) * RUNE_HR[m.group(2)] * 100, True
    m = BARE_RE.fullmatch(first)
    if m:
        n = float(m.group(1))
        if "." in m.group(1) and n < BARE_MAX:  # .25, 1.5: HR
            return n * 100, True
        if n.is_integer() and 1 <= n <= BARE_MAX:  # "2": 2 HR on a good item, 2 WSS on junk
            return n, False
    return None, True


def norm(name):
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


def load_listings(mode):
    """{(kind, normalized name): [listing]} of identified items with a price, and how many were read and priced."""
    path = CACHE / f"{mode}.jsonl"
    if not path.exists():
        raise SystemExit(f"no listings cached for {MODES[mode][0]}: run python tools/market_tiers.py --fetch")
    by_item, seen, unsure = defaultdict(list), set(), []
    read = priced = 0
    for line in path.open(encoding="utf-8"):
        r = json.loads(line)
        read += 1
        if not r["id_"]:
            continue  # an unidentified item's listing names its base only
        v, sure = wss(r["price"], r["hr"])
        if v is None:
            continue
        key = ("UNI" if r["quality"] == "Unique" else "SET", norm(r["name"]))
        entry = {"v": v, "eth": r["eth"], "cor": r["cor"], "user": r["user"], "code": r["code"]}
        if not sure:
            unsure.append((key, entry))
            continue
        once = (key, r["user"], v, r["eth"], r["cor"])
        if once not in seen:
            seen.add(once)
            by_item[key].append(entry)
        priced += 1
    # a bare whole number: HR or WSS, whichever is nearer the item's other listings (none: left out)
    sure_med = {k: statistics.median(x["v"] for x in ls) for k, ls in by_item.items() if len(ls) >= 3}
    for key, entry in unsure:
        if key not in sure_med:
            continue
        n, med = entry["v"], sure_med[key]
        entry["v"] = min((n * 100, n), key=lambda v: abs(math.log(v / med)))
        once = (key, entry["user"], entry["v"], entry["eth"], entry["cor"])
        if once not in seen:
            seen.add(once)
            by_item[key].append(entry)
        priced += 1
    return by_item, read, priced


def quantile(vals, q):
    k = (len(vals) - 1) * q
    lo = int(k)
    hi = min(lo + 1, len(vals) - 1)
    return vals[lo] + (vals[hi] - vals[lo]) * (k - lo)


def summary(listings):
    vals = sorted(x["v"] for x in listings)
    if not vals:
        return {"n": 0}
    return {"n": len(vals), "sellers": len({x["user"] for x in listings}), "p25": round(quantile(vals, .25), 2),
            "med": round(quantile(vals, .5), 2), "p75": round(quantile(vals, .75), 2)}


# ---------------------------------------------------------------- rows and suggestions

def base_rows():
    """[row] per unique / set base, and its ethereal row where the filter tiers ethereal drops differently."""
    groups, _, _, _ = T.analyse()
    sounds = T.load_sounds()
    main = {t: 0 for t in T.TOGGLES}
    rows = []
    for g in groups:
        table = T.restrict(T.variant_table(g, main), g.dims, {"LOC": "field", "GRAIL": "found"})
        ei = g.dims.index["ETH"]
        tiers = {}
        for eth in (0, 1):
            sub = {sc: k for sc, k in table.items() if sc[ei] == eth} or table
            best = max((k[0] for k in sub.values()), key=lambda look: T.LOOKS[look][1])
            tiers[eth] = TIER_NAMES[T.LOOKS[best][2]]
        lines = T.item_view(g, main, sounds)["lines"]
        names = list(dict.fromkeys(it["name"] for it in g.items))
        common = {"kind": g.kind, "code": g.code, "base": (g.base or {}).get("name", g.code), "category": g.category,
                  "names": names, "lines": lines}
        if tiers[0] == tiers[1]:
            rows.append({**common, "id": f"{g.kind}_{g.code}", "eth": None, "tier": tiers[0]})
        else:
            for eth in (0, 1):
                rows.append({**common, "id": f"{g.kind}_{g.code}" + ("_eth" if eth else ""), "eth": bool(eth),
                             "tier": tiers[eth]})
    return rows


def price_rows(rows, markets):
    """Each row's items with their prices per market, and the base's price per market (its best item's)."""
    names_on = defaultdict(int)
    for r in rows:
        if r["eth"] is not True:
            for n in r["names"]:
                names_on[(r["kind"], norm(n))] += 1
    for r in rows:
        r["items"] = []
        for n in r["names"]:
            key = (r["kind"], norm(n))
            entry = {"name": n}
            for mode, (by_item, _, _) in markets.items():
                ls = [x for x in by_item.get(key, []) if not x["cor"]]
                if names_on[key] > 1:  # one name on two bases: only this base's listings
                    ls = [x for x in ls if x["code"] == r["code"]]
                if r["eth"] is not None:
                    ls = [x for x in ls if x["eth"] == r["eth"]]
                entry[mode] = summary(ls)
                entry[mode]["upgraded"] = sum(x["code"] != r["code"] for x in ls)
            r["items"].append(entry)
        r["price"] = {}
        for mode in markets:
            ok = [it for it in r["items"] if it[mode]["n"] >= MIN_LISTINGS]
            best = max(ok, key=lambda it: it[mode]["med"]) if ok else None
            r["price"][mode] = {"item": best["name"], **best[mode]} if best else None


def bands(rows, mode):
    """{tier: middle price over its bases} and the cuts between neighbouring tiers ({upper tier: lowest price})."""
    meds = {}
    for t in LADDER:
        vals = [r["price"][mode]["med"] for r in rows if r["tier"] == t and r["price"][mode]]
        meds[t] = statistics.median(vals) if vals else None
    cuts = {}
    for lo, hi in zip(LADDER, LADDER[1:]):
        if meds[lo] and meds[hi]:
            cuts[hi] = round(math.sqrt(meds[lo] * meds[hi]), 2)
    return {"medians": meds, "cuts": cuts,
            "bases": {t: sum(1 for r in rows if r["tier"] == t and r["price"][mode]) for t in LADDER}}


def implied(price, band, kind):
    tier = "No tier"
    for t in LADDER[1:]:
        if t in band["cuts"] and price >= band["cuts"][t]:
            tier = t
    if kind == "SET" and tier == "Minimal":
        tier = "No tier"
    return tier


def fmt(v):
    return f"{v:g}"


def suggest(r, band_of):
    """The row's suggestion: {kind, to, strength, text}."""
    if r["tier"] in UNJUDGED:
        return {"kind": "unjudged", "to": None, "strength": None, "text": "Not judged by price."}
    ladder = SET_LADDER if r["kind"] == "SET" else LADDER
    cur = ladder.index(r["tier"])
    imp = {}
    for mode, p in r["price"].items():
        if p:
            imp[mode] = implied(p["med"], band_of[mode], r["kind"])
    r["implied"] = imp
    if not imp:
        return {"kind": "few", "to": None, "strength": None,
                "text": f"No item has {MIN_LISTINGS} uncorrupted listings in either market."}

    def says(mode):
        p = r["price"][mode]
        who = f" ({p['item']})" if len(r["names"]) > 1 else ""
        return f"{MODES[mode][0].split()[0]} {fmt(p['med'])} wss{who} is {imp[mode]}"

    text = "; ".join(says(m) for m in MODES if m in imp) + "."
    for m in imp:
        p = r["price"][m]
        if p["p75"] >= WIDE * max(p["p25"], 0.01):
            text += f" {MODES[m][0].split()[0]} prices spread widely ({fmt(p['p25'])}–{fmt(p['p75'])} wss)."
    ranks = {m: ladder.index(t) for m, t in imp.items()}
    if len(ranks) == 2:
        a, b = ranks["sc"], ranks["hc"]
        if a > cur and b > cur:
            return {"kind": "raise", "to": ladder[min(a, b)], "strength": "both", "text": text}
        if a < cur and b < cur:
            return {"kind": "lower", "to": ladder[max(a, b)], "strength": "both", "text": text}
        if a == cur and b == cur:
            return {"kind": "keep", "to": None, "strength": "both", "text": text}
        return {"kind": "split", "to": None, "strength": "both", "text": text}
    (mode, a), = ranks.items()
    other = next(m for m in MODES if m != mode)
    text += f" {MODES[other][0].split()[0]} has too few listings."
    if a > cur:
        return {"kind": "raise", "to": ladder[a], "strength": "one", "text": text}
    if a < cur:
        return {"kind": "lower", "to": ladder[a], "strength": "one", "text": text}
    return {"kind": "keep", "to": None, "strength": "one", "text": text}


def analyse():
    markets = {mode: load_listings(mode) for mode in MODES}
    rows = base_rows()
    price_rows(rows, markets)
    band_of = {mode: bands(rows, mode) for mode in MODES}
    for r in rows:
        r["implied"] = {}
        r["suggestion"] = suggest(r, band_of)
    known = {(r["kind"], norm(n)) for r in rows for n in r["names"]}
    unlisted = defaultdict(int)  # listed items the tiers don't have (unique maps...)
    for mode, (by_item, _, _) in markets.items():
        for key, ls in by_item.items():
            if key not in known:
                unlisted[key[1]] += len(ls)
    meta = read_meta()
    info = {mode: {"name": MODES[mode][0], "fetched": meta.get(mode, {}).get("fetched"),
                   "listings": markets[mode][1], "priced": markets[mode][2], **band_of[mode]} for mode in MODES}
    return rows, info, dict(unlisted)


def order_key(r):
    s = r["suggestion"]
    kinds = [k for k, _, _ in SECTIONS]
    p = max((r["price"][m]["med"] for m in MODES if r["price"][m]), default=0)
    return (kinds.index(s["kind"]), s["strength"] != "both", -p if s["kind"] != "lower" else p,
            T.CATEGORY_ORDER.index(r["category"]) if r["category"] in T.CATEGORY_ORDER else 99, r["names"][0])


# ---------------------------------------------------------------- output

def write_page(rows, info, unlisted):
    data = {"generated": datetime.date.today().isoformat(), "minListings": MIN_LISTINGS, "markets": info,
            "ladder": LADDER, "setLadder": SET_LADDER,
            "sections": [{"kind": k, "title": t, "note": n} for k, t, n in SECTIONS],
            "unlisted": sorted(unlisted.items(), key=lambda kv: -kv[1])[:12],
            "rows": [{k: r[k] for k in ("id", "kind", "code", "base", "category", "eth", "tier", "lines", "items",
                                        "price", "implied", "suggestion")} for r in sorted(rows, key=order_key)]}
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = TEMPLATE.read_text(encoding="utf-8")
    PAGE.write_text(html.replace("/*__DATA__*/null", blob), encoding="utf-8", newline="\n")
    print(f"wrote {PAGE.relative_to(ROOT)} ({PAGE.stat().st_size // 1024} KB)")


def row_line(r):
    eth = " (eth)" if r["eth"] else " (not eth)" if r["eth"] is False else ""
    prices = "  ".join(f"{m}: " + (f"{fmt(r['price'][m]['med']):>5} n={r['price'][m]['n']:<4}" if r["price"][m]
                                    else "    -       ") for m in MODES)
    s = r["suggestion"]
    to = f" -> {s['to']}" if s["to"] else ""
    return f"  {(' / '.join(r['names']) + eth)[:44]:44} {r['tier']:8}{to:12} {prices}"


def report(rows, info, unlisted):
    for mode, m in info.items():
        print(f"{m['name']}: {m['listings']} listings ({m['priced']} with a price I can read), fetched {m['fetched']}")
        print("   middle price per base: " + ", ".join(f"{t} {fmt(v) if v else '-'} ({m['bases'][t]} bases)"
                                                      for t, v in m["medians"].items()))
        print("   cuts: " + ", ".join(f"{t} from {fmt(v)}" for t, v in m["cuts"].items()))
    by_kind = defaultdict(list)
    for r in sorted(rows, key=order_key):
        by_kind[r["suggestion"]["kind"]].append(r)
    for kind, title, _ in SECTIONS:
        if kind in ("keep", "unjudged"):
            print(f"\n{title}: {len(by_kind[kind])} bases")
            continue
        print(f"\n{title} ({len(by_kind[kind])})")
        for r in by_kind[kind]:
            print(row_line(r))
    if unlisted:
        print("\nListed items with no tier: " + ", ".join(f"{n} ({c})" for n, c in sorted(unlisted.items(),
                                                                                         key=lambda kv: -kv[1])))


def show_item(rows, name):
    hits = [r for r in rows if any(norm(name) in norm(n) for n in r["names"])]
    if not hits:
        print(f"no unique or set item named like {name!r}")
    for r in hits:
        print(row_line(r))
        print(f"     {r['suggestion']['text']}")
        for line in r["lines"]:
            print(f"     filter: {line}")
        for it in r["items"]:
            print(f"     {it['name']:28} " + "  ".join(
                f"{m}: n={it[m]['n']:<4} " + (f"p25 {fmt(it[m]['p25'])} med {fmt(it[m]['med'])} p75 {fmt(it[m]['p75'])}"
                                              if it[m]["n"] else "") for m in MODES))


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--fetch", action="store_true", help="fetch the trade site's ladder listings first")
    ap.add_argument("--report", action="store_true", help="print the suggestions instead of writing the page")
    ap.add_argument("--item", metavar="NAME", help="print the rows of the bases an item is on")
    args = ap.parse_args()
    if args.fetch:
        for mode in MODES:
            fetch(mode)
    rows, info, unlisted = analyse()
    if args.item:
        show_item(rows, args.item)
    elif args.report:
        report(rows, info, unlisted)
    else:
        write_page(rows, info, unlisted)
    return 0


if __name__ == "__main__":
    sys.exit(main())
