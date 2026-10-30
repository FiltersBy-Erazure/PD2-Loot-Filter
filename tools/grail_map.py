#!/usr/bin/env python3
"""
The Grail Planner: how the Corrupted Ears change the time it takes to find every unique and set item (the grail) in
T1-T3 maps, per item and in all, with a planner that ranks the ears for the items a player is missing.

The output is one page for players, Erazure-Grail-Planner.html in the repo root (committed; the website's Grail
Planner page shows it, website/hooks.py), from tools/grail_map_template.html. It reads the game's own tables, so
build.bat, the hook and CI don't run it: run it again after a PD2 patch that changes drop tables, the ears, unique or
set items, or the maps (and after `gen_map_exp.py`'s map numbers change).

    python tools/grail_map.py "<Diablo II folder>"            write Erazure-Grail-Planner.html
    python tools/grail_map.py "<Diablo II folder>" --report   also print the headline numbers

A model, nothing measured in game:
- Map clears: every T1-T3 map's areas from docs/pd2-map-exp.tsv (spawn rolls, how many fall in the player's area,
  elite pack limits), their monster lists from Levels.txt and MonStats.txt. A normal roll is a group of one monster
  (by its Rarity) with its party; an elite roll is a champion pack (MonUMod's chance; leader + 1-3 champions, each
  with its party) or a unique monster with 3-6 minions. Champions spawn 2 levels up, unique monsters and their
  minions 3. Rarity multiplies a map's pack limits, density its spawn rolls (as gen_map_exp.py). One map boss a map.
- Drops: the base game's treasure class rules. A class's picks and no-drop chance; a sub-class keeps its parent's
  unique / set / rare / magic modifiers unless its own are higher; the monster's class is the last one of its group
  its level reaches; entries the game can't resolve (an "Act 5 (N) Armo C" that no row has) are left out with their
  weight. Quality: unique, set, rare, magic in turn, each 128 / ((ratio - (item level - quality level) / divisor) x
  128) at least the ratio's minimum, less its modifier / 1024; magic find with diminishing returns (unique 250, set
  500, rare 600); class items use ItemRatio's class rows. A unique (set) is picked among the base's uniques (sets)
  of a level at most the item level, by weight (weight 0 never); no candidate: a unique becomes rare, a set magic.
  Item level = the monster's level.
- The ears: their cube recipes ("map + ear <class>") through Properties. Per kill of a monster that is not a unique
  monster's minion, the extra drop chance repeats the monster's whole drop, and the class chance drops one item of
  the ear's class pool (its "<Class> Ear Drop" treasure class: PD2 pairs each class stat with it), quality rolled at
  the monster's level. Monster health from the ears' own text.
- Grail progress: each item drops as a Poisson process, so the items found after n maps are the sum of
  1 - e^(-rate x n) (the page does that part, and the switching-ears schedule).
"""
import argparse
import datetime
import json
import math
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import gen_map_exp as G  # noqa: E402
import pd2_data  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "Erazure-Grail-Planner.html"
TEMPLATE = ROOT / "tools" / "grail_map_template.html"
BASES = ROOT / "docs" / "pd2-bases.tsv"
ITEMS_TSV = ROOT / "docs" / "pd2-unique-set-items.tsv"
BS = "\\"

MFS = [0, 150, 300, 500]
# The average rare map with one corruption, per tier (density, rarity %): map_exp.py --ranges, 2026-10-16
RARE_ROLLS = {1: (91, 14), 2: (104, 18), 3: (126, 23)}
CHAMP_SIZE = 3.0     # a champion pack: the leader + 1-3 more
MINIONS = 4.5        # a unique monster's minions: 3-6
BOSS_LEVEL = 90      # a map boss's own level (MonStats Level(H) 89-91)
QUEST = {"vip", "msf", "hst", "hfh", "qf1", "qf2"}
CLASS_POOL = {  # the ears' class stats -> the treasure class PD2 drops from for each
    "zon_ear_drops": "Amazon Ear Drop", "sin_ear_drops": "Assassin Ear Drop", "barb_ear_drops": "Barb Ear Drop",
    "map_mon_dropclassitems": "Druid Ear Drop", "necro_ear_drops": "Necro Ear Drop",
    "paladin_ear_drops": "Paladin Ear Drop", "sorc_ear_drops": "Sorc Ear Drop"}
VERSION_WORDS = {"hit-skill": "on striking", "cast-skill": "when casting", "extra-skele-war": "Skeleton Warrior",
                 "extra-skele-archer": "Skeleton Archer"}
ELEMENTS = {"dmg-ltng": "Lightning", "dmg-cold": "Cold", "dmg-fire": "Fire", "dmg-pois": "Poison"}


def num(s):
    try:
        return int(float(s))
    except (TypeError, ValueError):
        return 0


# ---------------------------------------------------------------- the game's tables

class Tables:
    def __init__(self, game_dir):
        import pd2_mpq
        self.mpq_path = Path(game_dir) / "ProjectD2" / "pd2data.mpq"
        mpq = pd2_mpq.MPQ(self.mpq_path)
        excel = lambda n: pd2_data.read_table(mpq.read(BS.join(["data", "global", "excel", n])).decode("latin-1"))
        self.types = {r["Code"]: r for r in excel("ItemTypes.txt") if r.get("Code")}
        self.items = {}
        for kind, name in (("weapon", "Weapons.txt"), ("armor", "Armor.txt"), ("misc", "Misc.txt")):
            for r in excel(name):
                if r.get("code"):
                    self.items.setdefault(r["code"], dict(r, kind=kind))
        tcs = excel("TreasureClassEx.txt")
        self.tcs = {r["Treasure Class"]: r for r in tcs}
        self.tc_order = [r["Treasure Class"] for r in tcs]
        self.ratio = [r for r in excel("ItemRatio.txt") if r.get("Version") == "1"]
        self.uniques, self.sets = excel("UniqueItems.txt"), excel("SetItems.txt")
        self.props = {r["code"]: r for r in excel("Properties.txt") if r.get("code")}
        self.cube = excel("CubeMain.txt")
        self.monstats = {r["Id"]: r for r in excel("MonStats.txt") if r.get("Id")}
        self.levels = {r["Id"]: r for r in excel("Levels.txt") if r.get("Id", "").isdigit()}
        self.champ_chance = num(excel("MonUMod.txt")[0].get("constants")) / 100
        self.strings = pd2_data.read_tbl(mpq.read(BS.join(["data", "local", "LNG", "ENG", "patchstring.tbl"])))
        self.date = datetime.date.fromtimestamp(self.mpq_path.stat().st_mtime)


# ---------------------------------------------------------------- drops

class Drops:
    def __init__(self, t):
        self.t = t
        self.auto = self._auto()
        self.memo, self.qmemo = {}, {}

    def anc(self, code):
        out, todo = set(), [code]
        while todo:
            c = todo.pop()
            if c and c not in out and c in self.t.types:
                out.add(c)
                todo += [self.t.types[c].get("Equiv1", ""), self.t.types[c].get("Equiv2", "")]
        return out

    def _auto(self):
        """weapN / armoN / bowN...: spawnable items of the type with quality level in (N-3, N], weighted by their own
        type's Rarity."""
        lst = []
        for code, r in self.t.items.items():
            if r["kind"] == "misc" or r.get("spawnable") != "1":
                continue
            a = self.anc(r.get("type", "")) | self.anc(r.get("type2", ""))
            lst.append((code, num(r.get("level")), a, max(1, num(self.t.types.get(r.get("type", ""), {}).get("Rarity")))))
        auto = {}
        for t, tr in self.t.types.items():
            if tr.get("TreasureClass") == "1":
                for n in range(3, 97, 3):
                    auto[f"{t}{n}"] = [(c, w) for c, q, a, w in lst if t in a and n - 3 < q <= n]
        return auto

    def known(self, e):
        return (len(e) <= 4 and e in self.t.items) or e in self.t.tcs or e in self.auto

    def expand(self, name, mods=(0, 0, 0, 0)):
        """{(item code, modifiers): expected count} of one drop from a class (one player)."""
        key = (name, mods)
        if key in self.memo:
            return self.memo[key]
        if name in self.auto:
            ent = self.auto[name]
            tot = sum(w for _, w in ent)
            out = {(c, mods): w / tot for c, w in ent} if tot else {}
        elif name not in self.t.tcs:
            out = {(name, mods): 1.0}
        else:
            r = self.t.tcs[name]
            own = tuple(num(r.get(k)) for k in ("Unique", "Set", "Rare", "Magic"))
            mods = tuple(o if (p == 0 or o > p) else p for p, o in zip(mods, own))
            ent = [(r["Item%d" % i].strip('"').split(",")[0], num(r.get("Prob%d" % i))) for i in range(1, 11)
                   if r.get("Item%d" % i)]
            ent = [(e, p) for e, p in ent if p > 0 and self.known(e)]
            picks, out = num(r.get("Picks")) or 1, {}

            def add(e, k):
                for kk, v in (self.expand(e, mods) if e in self.t.tcs or e in self.auto else {(e, mods): 1.0}).items():
                    out[kk] = out.get(kk, 0) + k * v
            if picks < 0:
                left = -picks
                for e, p in ent:
                    n = min(p, left)
                    if n > 0:
                        add(e, n)
                    left -= n
            else:
                tot = sum(p for _, p in ent) + num(r.get("NoDrop"))
                for e, p in ent:
                    add(e, picks * p / tot)
        self.memo[key] = out
        return out

    def upgrade(self, name, mlvl):
        r = self.t.tcs.get(name)
        if not r or not r.get("group"):
            return name
        i = self.t.tc_order.index(name)
        while i + 1 < len(self.t.tc_order):
            nx = self.t.tcs[self.t.tc_order[i + 1]]
            if nx.get("group") != r["group"] or num(nx.get("level")) > mlvl:
                break
            i += 1
        return self.t.tc_order[i]

    def grail_kind(self, code):
        """Can the base be unique or set at all: weapons, armor, quivers, rings, amulets, jewels, charms."""
        it = self.t.items.get(code)
        if not it:
            return False
        a = self.anc(it.get("type", ""))
        if self.t.types.get(it.get("type", ""), {}).get("Normal") == "1":
            return False
        return it["kind"] in ("weapon", "armor") or bool(a & {"bowq", "xboq", "ring", "amul", "jewl", "char"})

    def unique_set(self, code, mods, ilvl, mf, has_u, has_s):
        """(chance to come out unique, chance to come out set) of one dropped item, after the fallbacks."""
        key = (code, mods, ilvl, mf, has_u, has_s)
        if key in self.qmemo:
            return self.qmemo[key]
        it = self.t.items[code]
        cls = 1 if self.t.types.get(it.get("type", ""), {}).get("Class") else 0
        uber = 1 if code != it.get("normcode") else 0
        row = next(r for r in self.t.ratio if num(r["Class Specific"]) == cls and num(r["Uber"]) == uber)
        R = {k: num(v) for k, v in row.items()}
        diff = ilvl - num(it.get("level"))

        def chance(ratio, div, mn, mod, dim):
            b = (ratio - diff // div) << 7
            if mf:
                d = mf + 100 if mf + 100 <= 110 else dim(mf + 100)
                b = 12800 * (ratio - diff // div) // d
            b = max(b, mn)
            c = b - b * mod // 1024
            return 1.0 if c <= 0 else min(1.0, 128 / c)
        pu = chance(R["Unique"], R["UniqueDivisor"], R["UniqueMin"], mods[0], lambda d: 50 * (5 * d - 500) // (d + 150) + 100)
        ps = chance(R["Set"], R["SetDivisor"], R["SetMin"], mods[1], lambda d: 100 * (5 * d - 500) // (d + 400) + 100)
        out = (pu if has_u else 0.0, (1 - pu) * ps if has_s else 0.0)
        self.qmemo[key] = out
        return out


# ---------------------------------------------------------------- map clears

class Maps:
    def __init__(self, t):
        self.t = t
        self.maps = {c: m for c, m in G.load().items() if m.tier <= 3}
        self.mixes = {}

    def mix(self, lid):
        """Per normal roll and per elite roll: {(kind, monster id): expected count}."""
        if lid in self.mixes:
            return self.mixes[lid]
        ms, lev = self.t.monstats, self.t.levels[str(lid)]
        ids = [lev["nmon%d" % i] for i in range(1, 26) if lev.get("nmon%d" % i)]
        pool = [(m, num(ms[m]["Rarity"])) for m in ids[:min(num(lev["NumMon"]), 13, len(ids))]
                if ms[m]["isSpawn"] == "1"]
        tot = sum(w for _, w in pool)
        normal, elite = {}, {}

        def add(d, k, v):
            d[k] = d.get(k, 0) + v

        def party(mid):
            r = ms[mid]
            m1, m2 = r["minion1"], r["minion2"]
            if not m1 or m1 not in ms:
                return 0.0, []
            lo, hi = num(r["PartyMin"]), num(r["PartyMax"])
            return (lo if lo >= hi else (lo + hi) / 2), ([m1, m2] if m2 and m2 in ms else [m1])

        def spawn(mid, chance):
            r = ms[mid]
            if r["placespawn"] == "1" and r["spawn"] in ms:
                p = (100 - chance - 1) / 100
                return [(mid, 1 - p), (r["spawn"], p)]
            return [(mid, 1.0)]
        for m, w in pool:
            if not w:
                continue
            f = w / tot
            for s, p in spawn(m, 20):
                r = ms[s]
                lo, hi = num(r["MinGrp"]), num(r["MaxGrp"])
                if r["BaseId"] in ("fallen1", "scarab1"):
                    lo = hi = 1
                if not lo or not hi or hi < lo:
                    continue
                sp = num(r["sparsePopulate"])
                k = f * p * (1.0 if not sp else (sp + 1) / 100) * (lo + hi) / 2
                add(normal, ("normal", s), k)
                pn, mm = party(s)
                for x in mm:
                    add(normal, ("party", x), k * pn / len(mm))
            for s, p in spawn(m, 0):
                c = self.t.champ_chance
                pn, mm = party(s)
                add(elite, ("champion", s), f * p * c * CHAMP_SIZE)
                for x in mm:
                    add(elite, ("party", x), f * p * c * CHAMP_SIZE * pn / len(mm))
                add(elite, ("unique", s), f * p * (1 - c))
                add(elite, ("minion", ms[s]["minion1"] if ms[s]["minion1"] in ms else s), f * p * (1 - c) * MINIONS)
        self.mixes[lid] = (normal, elite)
        return normal, elite

    def kills(self, code, d=0, r=0):
        """{(kind, treasure class, monster level): kills} of a full clear."""
        mp, ms = self.maps[code], self.t.monstats
        out = {}
        for a in mp.areas:
            normal, elite = self.mix(a.id)
            t = a.rolls * min(1 + d / 100, 10000 / a.den) if a.den else 0
            p = G.packs(t, math.floor(a.bmin * (1 + r / 100)), math.floor(a.bmax * (1 + r / 100))) if t > 0 else 0.0
            for src, k in ((normal, a.reach * (t - p)), (elite, a.reach * p + a.layout_packs)):
                for (kind, mid), v in src.items():
                    row = ms[mid]
                    lvl = mp.level + {"normal": 0, "party": 0, "champion": 2, "unique": 3, "minion": 3}[kind]
                    if kind == "party" and row["boss"] == "1" and num(row["Level(H)"]):
                        lvl = num(row["Level(H)"])
                    tc = row["TreasureClass%d(H)" % {"champion": 2, "unique": 3}.get(kind, 1)]
                    if tc:
                        out[(kind, tc, lvl)] = out.get((kind, tc, lvl), 0) + k * v
        out[("boss", f"Map Boss T{mp.tier}", BOSS_LEVEL)] = 1.0
        return out

    def tier_kills(self, tier, d, r):
        codes = [c for c, m in self.maps.items() if m.tier == tier]
        acc = {}
        for c in codes:
            for k, v in self.kills(c, d, r).items():
                acc[k] = acc.get(k, 0) + v / len(codes)
        return acc


# ---------------------------------------------------------------- the grail and the ears

def grail_items(t):
    names = {(r["kind"], r["index"]): r["name"] for r in pd2_data.read_table(
        "".join(l for l in ITEMS_TSV.read_text(encoding="utf-8").splitlines(True) if not l.startswith("#")))}
    bases = {r["code"]: r for r in pd2_data.read_table(
        "".join(l for l in BASES.read_text(encoding="utf-8").splitlines(True) if not l.startswith("#")))}
    items = []
    for r in t.uniques:
        code = r.get("code")
        if not code or r.get("enabled") != "1" or code in QUEST or code.startswith("t5"):
            continue  # unique maps and quest items are no grail items here
        items.append(dict(kind="UNI", index=r["index"], name=names.get(("UNI", r["index"]), r["index"]), code=code,
                          lvl=num(r["lvl"]), w=num(r["rarity"]), row=r))
    for r in t.sets:
        if r.get("item"):
            items.append(dict(kind="SET", index=r["index"], name=names.get(("SET", r["index"]), r["index"]),
                              code=r["item"], lvl=num(r["lvl"]), w=num(r["rarity"]), set=r.get("set", ""), row=r))
    by_name = {}
    for it in items:
        b = bases.get(it["code"], {})
        it["base"] = b.get("name") or t.items[it["code"]].get("name", it["code"])
        it["tier"] = b.get("tier", "") if it["code"] not in ("rin", "amu", "jew") and not it["code"].startswith("cm") else ""
        by_name.setdefault((it["kind"], it["name"]), []).append(it)
    props = [f"prop{i}" for i in range(1, 13)]
    for (kind, name), its in by_name.items():  # one name, two rows: versions, told apart by their properties
        if len(its) < 2:
            continue
        for it in its:
            mine = [it["row"].get(p) for p in props if it["row"].get(p)]
            others = {x for o in its if o is not it for x in (o["row"].get(p) for p in props) if x}
            if any(x in ELEMENTS for x in mine):
                el = next(ELEMENTS[x] for x in mine if x in ELEMENTS)
                it["ver"] = el + (", on death" if "death-skill" in mine else ", on level-up")
            else:
                it["ver"] = " ".join(VERSION_WORDS.get(x, x) for x in mine if x not in others)
    for it in items:
        del it["row"]
    return items


def ears(t):
    """[{name, code, rarity, extra, cls, pool, hp}] from the cube recipes "map + ear <class>"."""
    stat_vals = lambda prop, v: [(t.props[prop].get(f"stat{i}"), v) for i in range(1, 8)
                                 if t.props.get(prop, {}).get(f"stat{i}")]
    out = []
    for r in t.cube:
        m = re.match(r"map \+ ear (\w+)$", r.get("description", ""))
        if not m or r.get("enabled") != "1":
            continue
        code = r["input 2"].strip('"').split(",")[0]
        stats = {}
        for i in range(1, 6):
            prop = r.get(f"mod {i}", "")
            if prop:
                for st, v in stat_vals(prop, num(r.get(f"mod {i} max"))):
                    stats[st] = stats.get(st, 0) + v
        pool = [CLASS_POOL[s] for s in stats if s in CLASS_POOL]
        assert len(pool) == 1 and pool[0] in t.tcs, (m.group(1), stats)
        desc = t.strings.get(code + "Desc", "")
        hp = re.search(r"\+(\d+)% increased health", desc)
        out.append(dict(name=m.group(1).capitalize(), code=code, rarity=stats.get("map_glob_monsterrarity", 0),
                        extra=stats.get("map_glob_dropbonus", 0), cls=sum(v for s, v in stats.items() if s in CLASS_POOL),
                        pool=pool[0], hp=int(hp.group(1)) if hp else 0))
    out.sort(key=lambda e: e["name"])
    assert len(out) == 7, [e["name"] for e in out]
    return out


def compute(t, items, ear_list):
    d, m = Drops(t), Maps(t)
    idx = {}
    cand = {"UNI": {}, "SET": {}}
    for i, it in enumerate(items):
        if it["w"] > 0:
            cand[it["kind"]].setdefault(it["code"], []).append((it["lvl"], it["w"], i))
    N = len(items)

    def add_drops(dist, lvl, mf, k, out):
        for (code, mods), p in dist.items():
            if not d.grail_kind(code):
                continue
            cu = [(w, i) for l, w, i in cand["UNI"].get(code, []) if l <= lvl]
            cs = [(w, i) for l, w, i in cand["SET"].get(code, []) if l <= lvl]
            u, s = d.unique_set(code, mods, lvl, mf, bool(cu), bool(cs))
            for q, cl in ((u, cu), (s, cs)):
                if q:
                    tot = sum(w for w, _ in cl)
                    for w, i in cl:
                        out[i] += k * p * q * w / tot

    def drop_rates(kills, extra, mf):
        out = [0.0] * N
        for (kind, tc, lvl), n in kills.items():
            add_drops(d.expand(d.upgrade(tc, lvl)), lvl, mf, n * (1 if kind == "minion" else 1 + extra / 100), out)
        return out

    configs = sorted({(e["rarity"], e["extra"]) for e in ear_list})
    rates = {}
    for tier in (1, 2, 3):
        for mt in ("normal", "rare"):
            dd, rr = (0, 0) if mt == "normal" else RARE_ROLLS[tier]
            k0 = m.tier_kills(tier, dd, rr)
            kc = {c: m.tier_kills(tier, dd, rr + c[0]) for c in configs}
            for mf in MFS:
                entry = {"none": drop_rates(k0, 0, mf),
                         "common": [drop_rates(kc[c], c[1], mf) for c in configs], "cls": {}}
                for e in ear_list:
                    calls = {}
                    for (kind, tc, lvl), n in kc[(e["rarity"], e["extra"])].items():
                        if kind != "minion":
                            calls[lvl] = calls.get(lvl, 0) + n * e["cls"] / 100
                    out = [0.0] * N
                    for lvl, n in calls.items():
                        add_drops(d.expand(e["pool"]), lvl, mf, n, out)
                    entry["cls"][e["name"]] = out
                rates[f"{tier}|{mt}|{mf}"] = entry
    return rates, configs


def page_data(t, items, ear_list, rates, configs):
    per1000 = lambda x: float("%.3g" % (x * 1000))
    data = {"date": t.date.strftime("%d %B %Y").lstrip("0"), "mfs": MFS,
            "ears": [dict(name=e["name"], rarity=e["rarity"], extra=e["extra"], cls=e["cls"], hp=e["hp"],
                          config=configs.index((e["rarity"], e["extra"]))) for e in ear_list],
            "items": [{k: it[k] for k in ("kind", "index", "name", "base", "tier", "lvl", "w", "set", "ver") if it.get(k)}
                      for it in items], "rates": {}}
    for key, v in rates.items():
        data["rates"][key] = {"none": [per1000(x) for x in v["none"]],
                              "common": [[per1000(x) for x in c] for c in v["common"]],
                              "cls": {e: {str(i): per1000(x) for i, x in enumerate(xs) if x > 0} for e, xs in v["cls"].items()}}
    return data


DOC_HEAD = ("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
            "<style>html { color-scheme: dark; } body { margin: 0; background: #151412; }"  # the page's dark --bg
            " [hidden] { display: none !important; }</style>\n")


def report(items, rates, ear_list):
    key = "2|normal|300"
    v = rates[key]
    N = len(items)
    none = v["none"]
    drop = [i for i in range(N) if none[i] > 0]

    def found(r, n):
        return sum(1 - math.exp(-r[i] * n) for i in drop)

    def maps_to(r, frac):
        lo, hi = 0.0, 1e7
        for _ in range(80):
            mid = (lo + hi) / 2
            lo, hi = (lo, mid) if found(r, mid) >= frac * len(drop) else (mid, hi)
        return hi
    print(f"T2 non-magical maps, 300% MF: {len(drop)} of {N} grail items drop; unique + set drops per map: "
          f"no ear {sum(none):.2f}")
    print(f"   no ear: 90% of the map grail in {maps_to(none, .9):.0f} maps")
    for e in ear_list:
        r = [a + b for a, b in zip(v["common"][0], v["cls"][e["name"]])]
        print(f"   {e['name']:12} {sum(r):6.2f} per map, 90% in {maps_to(r, .9):.0f} maps")
    print("never from map monsters:", ", ".join(items[i]["name"] for i in range(N) if none[i] == 0))


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The Grail Planner page: Corrupted Ears and the grail, from the game's tables.")
    ap.add_argument("game_dir", help="the Diablo II folder (with ProjectD2)")
    ap.add_argument("--report", action="store_true", help="print the headline numbers")
    args = ap.parse_args()
    t = Tables(args.game_dir)
    items, ear_list = grail_items(t), ears(t)
    assert len({(e["rarity"], e["extra"], e["cls"], e["hp"]) for e in ear_list}) == 1, \
        "the ears no longer share their values: the page's text assumes they do"
    rates, configs = compute(t, items, ear_list)
    data = page_data(t, items, ear_list, rates, configs)
    page = DOC_HEAD + TEMPLATE.read_text(encoding="utf-8") + "\n</body>\n</html>\n"
    page = page.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    PAGE.write_text(page, encoding="utf-8", newline="\n")
    print(f"wrote {PAGE.name}: {len(items)} grail items, {len(rates)} settings, {len(page) // 1024} KB")
    if args.report:
        report(items, rates, ear_list)


if __name__ == "__main__":
    main()
