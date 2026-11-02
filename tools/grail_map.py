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
  minions 3. Rarity multiplies a map's pack limits, density its spawn rolls (as gen_map_exp.py). One map boss a map:
  its tier's bosses (MAP_BOSSES), each at its own level when boss-flagged.
- The Bitter Depths map event (EVENT_CHANCE, BD_*): its Lucion chests, monsters and boss, times the chance a map has
  it. Other map events and guests only for Cow King's Leathers.
- Drops: the base game's treasure class rules. A class's picks and no-drop chance; a sub-class keeps its parent's
  unique / set / rare / magic modifiers unless its own are higher; the monster's class is the last one of its group
  its level reaches; entries the game can't resolve (an "Act 5 (N) Armo C" that no row has) are left out with their
  weight. Quality: unique, set, rare, magic in turn, each 128 / ((ratio - (item level - quality level) / divisor) x
  128) at least the ratio's minimum, less its modifier / 1024; magic find with diminishing returns (unique 250, set
  500, rare 600); class items use ItemRatio's class rows. A unique (set) is picked among the base's uniques (sets)
  of a level at most the item level, by weight; a unique of weight 0 only when every candidate weighs 0 (PD2 took
  out the base game's minimum of 1, but a lone candidate needs no weight: Embersworn, the only unique on Demon Heart,
  drops though its rarity is empty); no candidate: a unique becomes rare, a set magic.
  Item level = the monster's level.
- The ears: their cube recipes ("map + ear <class>") through Properties. Per kill of a monster that is not a unique
  monster's minion, the extra drop chance repeats the monster's whole drop, and the class chance drops one item of
  the ear's class pool (its "<Class> Ear Drop" treasure class: PD2 pairs each class stat with it), quality rolled at
  the monster's level. Monster health from the ears' own text.
- Grail progress: each item drops as a Poisson process, so the items found after n maps are the sum of
  1 - e^(-rate x n) (the page does that part, and the switching-ears schedule).
- Farm spots: tools/grail_farm.py (every act boss, superunique and special encounter per difficulty, per kill, with
  the six-item limit; its docstring has those rules).
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

MFS = [0, 100, 200, 300, 400, 500, 600, 700, 800]
# The average rare map with one corruption, per tier (density, rarity %): map_exp.py --ranges, 2026-10-16
RARE_ROLLS = {1: (91, 14), 2: (104, 18), 3: (126, 23)}
CHAMP_SIZE = 3.0     # a champion pack: the leader + 1-3 more
MINIONS = 4.5        # a unique monster's minions: 3-6
# The maps' bosses (MonStats Id), one a map: PD2's map-boss lists per tier, and on T3 Kyovashad's, which is on none
# (checked in the 2026-11-01 build). In Nightmare and Hell a boss-flagged monster keeps its MonStats Level(H), any other
# takes the map's level (since 11-01 all are boss-flagged: 80-91). Each drops its own TreasureClass1(H): three use
# another tier's class (the Sanatorium's Guardian Map Boss T2, Gimli Map Boss T1, Johnathan Map Boss T2).
MAP_BOSSES = {
    1: ("megademonboss", "unravelerboss", "IceBoss", "TombBoss", "torajanBoss", "act2hireTraitorBoss", "spiderboss",
        "westmarchMapBoss", "doomknight3LibraryBoss", "PoisonedWellBoss"),
    2: ("ArcaneBoss", "ThroneBoss", "SewerBoss", "archerBoss", "CanyonBoss", "AshenBoss", "lernaeanhydra2",
        "TortureHallsBoss", "DarkTempleBoss", "DescentBoss"),
    3: ("baalminionboss", "BastionBoss", "CowBoss", "SiegeBoss", "MarketBoss", "leoricMapBoss", "DemonRoadBoss",
        "SkovosBoss", "KyovoshadBoss"),
}
# The Bitter Depths map event (area 207): 11% of non-magical and 34% of rare T1-T3 maps have an event, one of nine kinds
# (EVENT_CHANCE), and its portal opens late in the clear (BD_OPEN: map_exp.py's room model, 97% of full clears). Since
# the 2026-11-01 patch it holds 20 Lucion chests (bitterdepths.ds1: Objects 623, each LucionChestLow 3 items and
# LucionChestHigh 2, the opener's level for the quality roll, as in Lucion's vault) and 7 sparkly chests (the base
# game's chest code, left out: about 3% of the chests' grail drops), 5 elite packs (Levels.txt) and Zoltun Kulle
# (BD_BOSS). Its monsters: area 207's monster list, BD_ROLLS spawn rolls (map_exp.py's model, every one in reach) at
# the area's level. The map's ears reach them (map monster stats carry over), not the chests; density and rarity don't.
EVENT_CHANCE = {"normal": 0.11 / 9, "rare": 0.34 / 9}
BD_OPEN = 0.97
BD_AREA, BD_ROLLS, BD_BOSS, BD_LUCION_CHESTS = 207, 85.364, "TombEventBoss", 20
# Cow King's Leathers in maps: only Hell Bovines drop it (COW_SET), and a map has them two ways. The Bovine prefix ("Map
# contains Hell Bovines", one of the map guests' affix group) puts them on rare T1-T3 maps (map_exp.py's roller: these
# shares; corrupting adds none). The guest joins every area's monster list at weight 1 beside the natives, in groups
# and elite packs alike, and the prefix brings +25-30% density and +15-20% magic find (BOVINE_ROLLS: the average density
# and rarity of those maps, all their rolls, as RARE_ROLLS). And the Dark Wanderer map event (11% of non-magical, 34%
# of rare T1-T3 maps have an event, one of nine kinds) has up to three wanderers, each turning into a random act boss
# or superunique: the Cow King, a real one with 8 Hell Bovines, in about 1 rare map in 260 (if the player meets all
# three). Map guests and events are left out for every other item, but for the Bitter Depths (below).
BOVINE = {1: 0.0554, 2: 0.0353, 3: 0.0360}
BOVINE_ROLLS = {1: (101.3, 13.0), 2: (115.2, 16.4), 3: (134.6, 21.5)}
BOVINE_MF = range(15, 21)
DW_COW_KING = {"normal": 1 / 802.5, "rare": 1 / 259.6}
QUEST = {"vip", "msf", "hst", "hfh", "qf1", "qf2"}
# Uniques that are no grail items (the author, 2026-10-30), by UniqueItems index
NOT_GRAIL = {"Aidans Scar", "Band of Skulls", "Cage of the Unsullied", "Dark Abyss", "Hadriels Hand",
             "Itheraels Path", "Overlords Helm", "Rainbow Facet", "The Third Eye"}
CLASS_POOL = {  # the ears' class stats -> the treasure class PD2 drops from for each
    "zon_ear_drops": "Amazon Ear Drop", "sin_ear_drops": "Assassin Ear Drop", "barb_ear_drops": "Barb Ear Drop",
    "map_mon_dropclassitems": "Druid Ear Drop", "necro_ear_drops": "Necro Ear Drop",
    "paladin_ear_drops": "Paladin Ear Drop", "sorc_ear_drops": "Sorc Ear Drop"}


def num(s):
    try:
        return int(float(s))
    except (TypeError, ValueError):
        return 0


def cdiv(a, b):
    """The game's integer division: toward zero."""
    q = abs(a) // b
    return q if a >= 0 else -q


def game_strings(game_dir):
    """The game's strings by key, in its order: string.tbl, expansionstring.tbl, then PD2's patchstring.tbl."""
    import pd2_mpq
    game_dir, out = Path(game_dir), {}
    for mpq, tbl in ((game_dir / "d2data.mpq", "string.tbl"), (game_dir / "d2exp.mpq", "expansionstring.tbl"),
                     (game_dir / "ProjectD2" / "patch_d2.mpq", "patchstring.tbl"),
                     (game_dir / "ProjectD2" / "pd2data.mpq", "patchstring.tbl")):
        try:
            data = pd2_mpq.MPQ(mpq).read(BS.join(["data", "local", "LNG", "ENG", tbl]))
        except (OSError, KeyError, ValueError):
            continue
        own = {}
        for key, text in pd2_data.read_tbl_list(data):
            own.setdefault(key, text)  # a key twice in one table: the game finds the first
        out.update(own)
    return out


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
        self.set_names = {r["index"]: r["name"] for r in excel("Sets.txt") if r.get("index")}
        self.props = {r["code"]: r for r in excel("Properties.txt") if r.get("code")}
        self.cube = excel("CubeMain.txt")
        self.monstats = {r["Id"]: r for r in excel("MonStats.txt") if r.get("Id")}
        self.levels = {r["Id"]: r for r in excel("Levels.txt") if r.get("Id", "").isdigit()}
        self.champ_chance = num(excel("MonUMod.txt")[0].get("constants")) / 100
        self.strings = pd2_data.read_tbl(mpq.read(BS.join(["data", "local", "LNG", "ENG", "patchstring.tbl"])))
        self.names = game_strings(game_dir)  # every table's strings: what the game shows for a key
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
            b = (ratio - cdiv(diff, div)) << 7
            if mf:
                d = mf + 100 if mf + 100 <= 110 else dim(mf + 100)
                b = cdiv(12800 * (ratio - cdiv(diff, div)), d)
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
        return out

    def boss_kill(self, mid, level):
        """(kind, treasure class, monster level) of a boss in an area of this level: a boss-flagged one keeps its own."""
        r = self.t.monstats[mid]
        return "boss", r["TreasureClass1(H)"], num(r["Level(H)"]) if r["boss"] == "1" and num(r["Level(H)"]) else level

    def tier_kills(self, tier, d, r):
        """kills() averaged over the tier's maps, each with one of the tier's bosses."""
        codes = [c for c, m in self.maps.items() if m.tier == tier]
        bosses = MAP_BOSSES[tier]
        assert len(bosses) == len(codes), f"T{tier}: {len(codes)} maps, {len(bosses)} bosses in MAP_BOSSES"
        level = {self.maps[c].level for c in codes}
        assert len(level) == 1, level
        acc = {}
        for c in codes:
            for k, v in self.kills(c, d, r).items():
                acc[k] = acc.get(k, 0) + v / len(codes)
        for b in bosses:
            k = self.boss_kill(b, next(iter(level)))
            acc[k] = acc.get(k, 0) + 1 / len(bosses)
        return acc

    def area_kills(self, lid, rolls, level):
        """{(kind, treasure class, monster level): kills} of a full clear of one area outside the map model (every
        spawn roll in reach, the area's own elite pack limits), at the given level."""
        lev, ms = self.t.levels[str(lid)], self.t.monstats
        normal, elite = self.mix(lid)
        p = G.packs(rolls, num(lev["MonUMin(H)"]), num(lev["MonUMax(H)"]))
        out = {}
        for src, k in ((normal, rolls - p), (elite, p)):
            for (kind, mid), v in src.items():
                lvl = level + {"normal": 0, "party": 0, "champion": 2, "unique": 3, "minion": 3}[kind]
                if kind == "party" and ms[mid]["boss"] == "1" and num(ms[mid]["Level(H)"]):
                    lvl = num(ms[mid]["Level(H)"])
                tc = ms[mid]["TreasureClass%d(H)" % {"champion": 2, "unique": 3}.get(kind, 1)]
                if tc:
                    out[(kind, tc, lvl)] = out.get((kind, tc, lvl), 0) + k * v
        return out

    def guest_kills(self, code, guest, d=0, r=0):
        """{(kind, treasure class, monster level): kills} of a full clear, of a guest monster alone: it joins each
        area's monster list at weight 1 beside the natives' total weight W, so it takes 1 spawn roll in W + 1, in
        groups and elite packs alike (a guest with no spawn quirks: Hell Bovines)."""
        mp, ms = self.maps[code], self.t.monstats
        g, c = ms[guest], self.t.champ_chance
        minion = g["minion1"] if g["minion1"] in ms else guest
        out = {}
        for a in mp.areas:
            if not a.rolls > 0:
                continue
            lev = self.t.levels[str(a.id)]
            ids = [lev["nmon%d" % i] for i in range(1, 26) if lev.get("nmon%d" % i)]
            w = sum(num(ms[x]["Rarity"]) for x in ids[:min(num(lev["NumMon"]), 13, len(ids))] if ms[x]["isSpawn"] == "1")
            f = 1 / (w + 1)
            normal = {("normal", guest): f * (num(g["MinGrp"]) + num(g["MaxGrp"])) / 2}
            elite = {("champion", guest): f * c * CHAMP_SIZE, ("unique", guest): f * (1 - c),
                     ("minion", minion): f * (1 - c) * MINIONS}
            t = a.rolls * min(1 + d / 100, 10000 / a.den) if a.den else 0
            p = G.packs(t, math.floor(a.bmin * (1 + r / 100)), math.floor(a.bmax * (1 + r / 100))) if t > 0 else 0.0
            for src, k in ((normal, a.reach * (t - p)), (elite, a.reach * p + a.layout_packs)):
                for (kind, mid), v in src.items():
                    lvl = mp.level + {"normal": 0, "champion": 2, "unique": 3, "minion": 3}[kind]
                    tc = ms[mid]["TreasureClass%d(H)" % {"champion": 2, "unique": 3}.get(kind, 1)]
                    if tc:
                        out[(kind, tc, lvl)] = out.get((kind, tc, lvl), 0) + k * v
        return out

    def tier_guest_kills(self, tier, guest, d, r):
        codes = [c for c, m in self.maps.items() if m.tier == tier]
        acc = {}
        for c in codes:
            for k, v in self.guest_kills(c, guest, d, r).items():
                acc[k] = acc.get(k, 0) + v / len(codes)
        return acc


# ---------------------------------------------------------------- the grail and the ears

def grail_items(t):
    """The grail: one item per unique or set name. The table rows of one name (Akarat's Devotion's two,
    Cyclopean Roar's two...) are one grail item: any of them finds it (the author, 2026-10-30). Each item keeps
    its rows (base code, level, weight; a unique's UniqueItems row number) for the drop rolls."""
    names = {(r["kind"], r["index"]): r["name"] for r in pd2_data.read_table(
        "".join(l for l in ITEMS_TSV.read_text(encoding="utf-8").splitlines(True) if not l.startswith("#")))}
    bases = {r["code"]: r for r in pd2_data.read_table(
        "".join(l for l in BASES.read_text(encoding="utf-8").splitlines(True) if not l.startswith("#")))}
    items, by_name = [], {}

    def add(kind, index, code, lvl, w, uid=None, set_name=""):
        name = names.get((kind, index), index)
        it = by_name.get((kind, name))
        if it is None:
            b = bases.get(code, {})
            it = dict(kind=kind, index=index, name=name, code=code, lvl=lvl, w=0, rows=[], uids=[],
                      base=b.get("name") or t.items[code].get("name", code),
                      tier=b.get("tier", "") if code not in ("rin", "amu", "jew") and not code.startswith("cm") else "")
            if set_name:
                it["set"] = set_name
            by_name[(kind, name)] = it
            items.append(it)
        it["rows"].append((code, lvl, w))
        it["lvl"], it["w"] = min(it["lvl"], lvl), it["w"] + w
        if uid is not None:
            it["uids"].append(uid)
    for n, r in enumerate(t.uniques):
        code = r.get("code")
        if not code or r.get("enabled") != "1" or code in QUEST or code.startswith("t5") or r["index"] in NOT_GRAIL:
            continue  # unique maps, quest items and the author's list are no grail items
        add("UNI", r["index"], code, num(r["lvl"]), num(r["rarity"]), uid=n)
    for r in t.sets:
        if r.get("item"):
            key = t.set_names.get(r.get("set", ""), r.get("set", ""))
            add("SET", r["index"], r["item"], num(r["lvl"]), num(r["rarity"]),
                set_name=t.names.get(key, key))  # the game's name: McAuley's Folly is Sander's Folly
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
        # the ear's own words in game: what its pool drops, and what else it does to the map
        lines = [l.strip() for l in desc.split("\n") if l.strip()]
        what = next((re.search(r"drop additional (.+)$", l).group(1) for l in lines
                     if re.search(r"drop additional (?!items)", l)), "")
        harder = [l for l in lines if not re.search(r"increased health|drop additional|monster rarity|^Cube with", l)]
        out.append(dict(name=m.group(1).capitalize(), code=code, rarity=stats.get("map_glob_monsterrarity", 0),
                        extra=stats.get("map_glob_dropbonus", 0), cls=sum(v for s, v in stats.items() if s in CLASS_POOL),
                        pool=pool[0], hp=int(hp.group(1)) if hp else 0, what=what, harder=harder))
    out.sort(key=lambda e: e["name"])
    assert len(out) == 7, [e["name"] for e in out]
    return out


# Cow King's Leathers: the set pick passes it over unless a Hell Bovine (MonStats hellbovine: the Secret Cow Level's
# cows and the Cow King, and the "Bovine" guest some maps roll) made the drop; Blood Moon's own cows are other monsters
COW_SET = {"Cow King's Horns", "Cow King's Hide", "Cow King's Hoofs"}


def candidates(items):
    """{"UNI" / "SET": {base code: [(level, weight, item number)]}}: what a unique or set of the base can come out as
    (a grail item's every row: its versions add up); "COW": the item numbers of Cow King's Leathers."""
    cand = {"UNI": {}, "SET": {}, "COW": set()}
    for i, it in enumerate(items):
        if it["kind"] == "SET" and it["index"] in COW_SET:
            cand["COW"].add(i)
        for code, lvl, w in it["rows"]:
            cand[it["kind"]].setdefault(code, []).append((lvl, w, i))
    assert len(cand["COW"]) == len(COW_SET), "Cow King's Leathers' items were renamed"
    return cand


def weighed(entries):
    """The unique pick among a base's candidates [(weight, item)] of the item's level: by weight, and a weight-0 row
    only when every candidate weighs 0: then the game's rand(0) is 0 and its pick runs to the last candidate."""
    if sum(w for w, _ in entries) > 0:
        return [(w, i) for w, i in entries if w > 0]
    return [(1, entries[-1][1])] if entries else []


def add_drops(d, cand, dist, lvl, mf, k, out, bovine=False):
    """Add k drops of `dist` ({(base code, quality modifiers): expected count}) at item level lvl to out (per item);
    bovine: a Hell Bovine's drop, the only one that can be Cow King's Leathers."""
    for (code, mods), p in dist.items():
        if not d.grail_kind(code):
            continue
        cu = weighed([(w, i) for l, w, i in cand["UNI"].get(code, []) if l <= lvl])
        cs = [(w, i) for l, w, i in cand["SET"].get(code, []) if l <= lvl and (bovine or i not in cand["COW"])]
        u, s = d.unique_set(code, mods, lvl, mf, bool(cu), bool(cs))
        for q, cl in ((u, cu), (s, cs)):
            if q:
                tot = sum(w for w, _ in cl)
                for w, i in cl:
                    out[i] += k * p * q * w / tot


def compute(t, items, ear_list):
    d, m = Drops(t), Maps(t)
    cand = candidates(items)
    N = len(items)

    def add(dist, lvl, mf, k, out):
        add_drops(d, cand, dist, lvl, mf, k, out)

    def drop_rates(kills, extra, mf):
        out = [0.0] * N
        for (kind, tc, lvl), n in kills.items():
            add(d.expand(d.upgrade(tc, lvl)), lvl, mf, n * (1 if kind == "minion" else 1 + extra / 100), out)
        return out

    configs = sorted({(e["rarity"], e["extra"]) for e in ear_list})
    rates, kills = {}, {}
    for tier in (1, 2, 3):
        for mt in ("normal", "rare"):
            dd, rr = (0, 0) if mt == "normal" else RARE_ROLLS[tier]
            k0 = m.tier_kills(tier, dd, rr)
            kills[f"{tier}|{mt}"] = round(sum(k0.values()))
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
                        add(d.expand(e["pool"]), lvl, mf, n, out)
                    entry["cls"][e["name"]] = out
                rates[f"{tier}|{mt}|{mf}"] = entry
    return rates, configs, kills


def add_cow_rates(t, items, ear_list, configs, rates):
    """Cow King's Leathers' pieces per map, into compute's rates: the Bovine guest's kills on rare maps (BOVINE) and
    the Dark Wanderer's Cow King with his 8 Hell Bovines (DW_COW_KING), each a Hell Bovine's drop. An ear repeats a
    non-minion's drop (extra) and adds a pick of its class pool (cls: of the pools only the Barbarian ear's holds a Cow
    King base, War Hat); its rarity adds the guest's packs."""
    import grail_farm as GF
    d, m, cand = Drops(t), Maps(t), candidates(items)
    cow, N = sorted(cand["COW"]), len(items)
    king_tc = next(r for r in t.superuniques if r.get("Superunique") == "The Cow King")["TC(H)"]
    king_drop = GF.Flow(d, GF.CAP).per_drop(king_tc)[0]  # his five picks under the six-item limit
    cache = {}

    def per_kill(key, dist, lvl, mf):  # [expected pieces] of one drop
        if (key, lvl, mf) not in cache:
            out = [0.0] * N
            add_drops(d, cand, dist(), lvl, mf, 1, out, True)
            cache[(key, lvl, mf)] = [out[i] for i in cow]
        return cache[(key, lvl, mf)]

    def pieces(kills, mf, extra=0, ear=None):
        """[expected pieces] of {(kind, treasure class, level): kills}: their own drops (a non-minion's repeated by an
        ear's extra drop), or with ear, its class pool's picks (non-minions only)."""
        v = [0.0] * len(cow)
        for (kind, tc, lvl), n in kills.items():
            if ear:
                if kind == "minion":
                    continue
                k, r = n * ear["cls"] / 100, per_kill(("pool", ear["name"]), lambda: d.expand(ear["pool"]), lvl, mf)
            else:
                drop = (lambda: king_drop) if tc == king_tc else (lambda: d.expand(d.upgrade(tc, lvl)))
                k, r = n * (1 if kind == "minion" else 1 + extra / 100), per_kill(tc, drop, lvl, mf)
            for j, x in enumerate(r):
                v[j] += k * x
        return v

    for tier in (1, 2, 3):
        level = {mp.level for mp in m.maps.values() if mp.tier == tier}
        assert len(level) == 1, level
        level = level.pop() + 3  # a superunique and his minions: the area level + 3
        king = {("unique", king_tc, level): 1.0, ("minion", "Cow (H)", level): 8.0}
        bd, br = BOVINE_ROLLS[tier]
        guest = {c: m.tier_guest_kills(tier, "hellbovine", bd, br + c[0]) for c in [(0, 0)] + list(configs)}
        for mt in ("normal", "rare"):
            for mf in MFS:
                e = rates[f"{tier}|{mt}|{mf}"]

                def one_map(cfg, **kw):  # an average map of this kind: the guest's pieces and the Cow King's
                    g = [0.0] * len(cow)
                    if mt == "rare":  # the prefix's own magic find, 15-20 evenly
                        for b in BOVINE_MF:
                            g = [a + x / len(BOVINE_MF) for a, x in zip(g, pieces(guest[cfg], mf + b, **kw))]
                    k = pieces(king, mf, **kw)
                    return [BOVINE[tier] * a + DW_COW_KING[mt] * b if mt == "rare" else DW_COW_KING[mt] * b
                            for a, b in zip(g, k)]
                for j, x in zip(cow, one_map((0, 0))):
                    e["none"][j] += x
                for ci, c in enumerate(configs):
                    for j, x in zip(cow, one_map(c, extra=c[1])):
                        e["common"][ci][j] += x
                for ear in ear_list:
                    for j, x in zip(cow, one_map((ear["rarity"], ear["extra"]), ear=ear)):
                        e["cls"][ear["name"]][j] += x


def add_bitter_depths_rates(t, items, ear_list, configs, rates):
    """The Bitter Depths' grail drops per map, into compute's rates: the chance a map has the event and its portal opens
    (EVENT_CHANCE x BD_OPEN) times one run, the same in every tier: its Lucion chests (no ear reaches them), its
    monsters and Zoltun Kulle (an ear's extra drop repeats a non-minion's drop, its class chance picks its pool)."""
    import grail_farm as GF
    d, m, cand, N = Drops(t), Maps(t), candidates(items), len(items)
    level = num(t.levels[str(BD_AREA)]["MonLvl3Ex"])
    kills = m.area_kills(BD_AREA, BD_ROLLS, level)
    boss = m.boss_kill(BD_BOSS, level)
    kills[boss] = kills.get(boss, 0) + 1.0
    chest = [(GF.Flow(d, 3).per_drop("LucionChestLow")[0], GF.CLVL), (GF.Flow(d, 2).per_drop("LucionChestHigh")[0], GF.CLVL)]

    def run(mf, extra=0, ear=None):
        out = [0.0] * N
        if ear:  # its class pool's picks only (the "cls" part)
            for (kind, tc, lvl), n in kills.items():
                if kind != "minion":
                    add_drops(d, cand, d.expand(ear["pool"]), lvl, mf, n * ear["cls"] / 100, out)
            return out
        for (kind, tc, lvl), n in kills.items():
            add_drops(d, cand, d.expand(d.upgrade(tc, lvl)), lvl, mf, n * (1 if kind == "minion" else 1 + extra / 100), out)
        for dist, lvl in chest:
            add_drops(d, cand, dist, lvl, mf, BD_LUCION_CHESTS, out)
        return out

    for mf in MFS:
        none, common = run(mf), [run(mf, c[1]) for c in configs]
        cls = {e["name"]: run(mf, ear=e) for e in ear_list}
        for tier in (1, 2, 3):
            for mt in ("normal", "rare"):
                f, e = EVENT_CHANCE[mt] * BD_OPEN, rates[f"{tier}|{mt}|{mf}"]
                e["none"] = [a + f * b for a, b in zip(e["none"], none)]
                e["common"] = [[a + f * b for a, b in zip(x, y)] for x, y in zip(e["common"], common)]
                for name, v in cls.items():
                    e["cls"][name] = [a + f * b for a, b in zip(e["cls"][name], v)]


# The filter and the grail: how Erazure - Main draws an unidentified item you haven't discovered yet and one you have,
# on two filter levels, for one item of each kind (tier_map's engine runs the filter's own rules)
LOOK_EXAMPLES = [("UNI", "ssd", "A unique item in no value tier"), ("SET", "xhl", "A set item"),
                 ("SET", "rin", "A set ring (amulets alike)"), ("UNI", "uar", "A unique item in a value tier")]
LOOK_LEVELS = [1, 12]


def filter_looks():
    import build
    import tier_map as T
    groups, _, variants, _ = T.analyse()
    by = {(g.kind, g.code): g for g in groups}
    names, palette = T.load_levels(), T.load_palette()
    out = []
    for kind, code, what in LOOK_EXAMPLES:
        g = by[(kind, code)]
        tier, _ = T.tier_of(g, variants[build.MAIN])
        cells = {}
        for grail in ("new", "found"):
            for lv in LOOK_LEVELS:
                a = dict(variants[build.MAIN], ETH=0, CLASS=g.dims.values["CLASS"][0], CLVL=99, LOC="field", GRAIL=grail,
                         FILTLVL=lv)
                (look, chat, sound, icons), _ = g.run(a)
                cells[f"{grail}|{lv}"] = dict(hidden=look == "HIDDEN", lines=[] if look == "HIDDEN" else
                                              T.label(g, tuple(a[d] for d in T.DIMS), {}), chat=bool(chat),
                                              sound=bool(sound), icons=[[palette.get(c) if c else None for c in layer]
                                                                        for layer in icons])
        out.append(dict(what=what, kind=kind, items=list(dict.fromkeys(it["name"] for it in g.items)),
                        base=(g.base or {}).get("name", code), tier=tier, cells=cells))
    return {"levels": {str(lv): names[lv].split(" - ")[0] for lv in LOOK_LEVELS}, "examples": out}


def page_data(t, items, ear_list, rates, configs, kills, farm):
    per1000 = lambda x: float("%.3g" % (x * 1000))
    data = {"date": t.date.strftime("%d %B %Y").lstrip("0"), "mfs": MFS,
            "ears": [dict(name=e["name"], rarity=e["rarity"], extra=e["extra"], cls=e["cls"], hp=e["hp"],
                          config=configs.index((e["rarity"], e["extra"])), what=e["what"], harder=e["harder"],
                          nounique=e.get("nounique", 0)) for e in ear_list],
            "items": [{k: it[k] for k in ("kind", "index", "name", "base", "tier", "lvl", "w", "set") if it.get(k)}
                      for it in items], "rates": {}, "kills": kills, "looks": filter_looks(), "farm": farm,
            "notGrail": sorted(NOT_GRAIL)}  # a pasted list may name them: the page says they're left out
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
    rates, configs, kills = compute(t, items, ear_list)
    import grail_farm as GF
    strings = GF.prepare(t, args.game_dir)
    add_cow_rates(t, items, ear_list, configs, rates)
    add_bitter_depths_rates(t, items, ear_list, configs, rates)
    d = Drops(t)
    cand = candidates(items)
    for e in ear_list:  # the share of an ear's class items on bases no grail unique can roll on (wasted unique rolls)
        dist = d.expand(e["pool"])
        e["nounique"] = round(sum(v for (c, _), v in dist.items() if c not in cand["UNI"]) / sum(dist.values()), 2)
    spots = GF.catalogue(t, d, strings)
    farm_rates = GF.spot_rates(t, d, items, spots, MFS)
    missing = [it["name"] for i, it in enumerate(items)
               if not any(r["named"][MFS[-1]][i] > 0 for r in farm_rates.values())]
    assert not missing, f"grail items no farm spot drops: {missing}"
    farm = GF.pack(items, spots, farm_rates, MFS, GF.gheed_offers(t))
    farm["gamble"] = GF.pack_gamble(t, items, GF.gamble_rates(t, d, items))
    farm["gheedBases"] = GF.gheed_bases(t, items)
    data = page_data(t, items, ear_list, rates, configs, kills, farm)
    page = DOC_HEAD + TEMPLATE.read_text(encoding="utf-8") + "\n</body>\n</html>\n"
    page = page.replace("/*__DATA__*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    PAGE.write_text(page, encoding="utf-8", newline="\n")
    print(f"wrote {PAGE.name}: {len(items)} grail items, {len(rates)} settings, {len(page) // 1024} KB")
    if args.report:
        report(items, rates, ear_list)


if __name__ == "__main__":
    main()
