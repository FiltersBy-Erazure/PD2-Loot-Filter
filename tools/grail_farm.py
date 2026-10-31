#!/usr/bin/env python3
"""
Grail farm spots: for every unique and set item, the monsters worth killing for it (act bosses, the other bosses,
superuniques and the special encounters), per difficulty, per kill and for one player, from the game's own tables.
tools/grail_map.py imports it and puts the results on the Grail Planner page; run alone, it prints them:

    python tools/grail_farm.py "<Diablo II folder>" --sources            every spot: place, level, class, items a kill
    python tools/grail_farm.py "<Diablo II folder>" --item "Knell Striker"   an item's best spots per difficulty
    python tools/grail_farm.py "<Diablo II folder>" --spot "Pindleskin"     a spot's most likely grail items
    python tools/grail_farm.py "<Diablo II folder>" --selftest           the six-item limit against a simulation

A model, nothing measured in game. The rules (the base game's unless said):
- A kill makes one drop from the monster's treasure class: its picks (a negative number takes the entries in order,
  each its Prob times), its no-drop chance (one player: the tables as they are), sub-classes inside the same drop,
  a sub-class keeping its parent's unique / set / rare / magic modifiers unless its own are higher. A drop makes at
  most six items, gold and potions included: once it has six, the picks left make nothing (Duriel's five picks of a
  seven-pick class always end at six). Quality and the unique / set pick as on the Grail Planner (grail_map.py).
- Monster level, which is the item level: Normal the monster's MonStats Level; Nightmare and Hell the area's
  (Levels MonLvl2Ex / MonLvl3Ex), but monsters flagged boss keep their own Level(N) / Level(H). Superuniques and
  their minions 3 more. Nightmare and Hell take the last class of the monster's group its level reaches; Normal never.
- Treasure class: a superunique's SuperUniques TC / TC(N) / TC(H); an act boss's TreasureClass1 by difficulty (the
  quest class only drops while the quest is open); a minion its own TreasureClass1.
- Corrupted Zones (Hell games made with Baal's quest done, one of 37 area groups at a time, PD2's patch notes): the
  zone's monsters have area level 85 (boss-flagged monsters keep theirs), so a superunique there is level 88.
- Special encounters, Hell: Lilith, Uber Duriel and Uber Izual drop their classes at level 110; D.Clone drops
  Annihilus every kill; Uber Tristram drops the Hellfire Torch once a run, when the last of its three bosses dies
  (they have no treasure class); the Uber Ancients' altar drops 12t+8 to 18t+11 items of the "UberAncients" class
  (t = the ancients fought: the players switch 1, 2 or 3 of the statues on before touching the altar) at its area's
  level 90; Lucion's vault holds 10 chests (its map piece), each dropping "LucionChestLow" (at most 3 items) and
  "LucionChestHigh" (at most 2, 3 or 4 for PD2's tiers 0, 1, 2) at the opener's character level.
- Gheed's map event: each of its 5 offers (one in 200 shops gives one slot to a ring of its own) is a unique, a
  UniqueItems row picked at random (jewels, disabled rows, rows of weight 0 or a level outside 1-99 tried again),
  one with a level requirement of 60 or more turned down (requirement - 59)% of the time, 10 tries a slot.
- Where a spot is: fixed (the same place every game) or anywhere in its area, and the areas from the nearest
  waypoint (FIXED_AREAS, FIXED_KEYS, OUTDOOR below).
"""
import argparse
import math
import random
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import grail_map as GM  # noqa: E402
import pd2_data  # noqa: E402

BS = "\\"
num = GM.num
DIFFS = ("Normal", "Nightmare", "Hell")
SUFFIX = ("", "(N)", "(H)")
CAP = 6
CLVL = 95            # the character opening Lucion's chests (their item level)
SU_BONUS = 3         # superuniques and their minions: 3 levels over the area (or their own boss level)
ZONE_LEVEL = 85

# Where the game places each superunique (SuperUniques key -> Levels Id): its map pieces (DS1 presets) for most, the
# area's event for Chaos Sanctuary's seal bosses, Nihlathak and Baal's minions. Kaa: the true tomb, one of 66-72.
PLACES = {
    "Corpsefire": 8, "Bishibosh": 3, "Coldcrow": 9, "Rakanishu": 4, "Treehead WoodFist": 5, "Bonebreak": 18,
    "Griswold": 38, "The Countess": 25, "Pitspawn Fouldog": 30, "Boneash": 33, "The Smith": 28, "The Cow King": 39,
    "Radament": 49, "Beetleburst": 43, "Dark Elder": 44, "Leatherarm": 59, "Bloodwitch the Wild": 60, "Fangskin": 61,
    "Coldworm the Burrower": 64, "Fire Eye": 54, "Ancient Kaa the Soulless": 66,
    "Web Mage the Burning": 85, "Stormtree": 78, "Witch Doctor Endugu": 91, "Icehawk Riftwing": 92,
    "Sarina the Battlemaid": 94, "Ismail Vilehand": 83, "Geleb Flamefinger": 83, "Toorc Icefist": 83,
    "Bremm Sparkfist": 102, "Wyand Voidfinger": 102, "Maffer Dragonhand": 102,
    "The Feature Creep": 107, "Infector of Souls": 108, "Lord De Seis": 108, "Grand Vizier of Chaos": 108,
    "Siege Boss": 110, "Dac Farren": 110, "Megaflow Rectifier": 111, "Sharp Tooth Sayer": 111,
    "Eyeback Unleashed": 111, "Threash Socket": 112, "Frozenstein": 114,
    "Bonesaw Breaker": 115, "Snapchip Shatter": 119, "Pindleskin": 121, "Nihlathak Boss": 124,
    "Baal Subject 1": 131, "Baal Subject 2": 131, "Baal Subject 3": 131, "Baal Subject 4": 131, "Baal Subject 5": 131,
}
# Rows no area places (or only maps): no farm spots. Blaze Ripper: his piece ("Barricade Snow Unique") has no code that
# places it, and the author doubts he spawns at all (2026-10-31).
UNPLACED = {"Blaze Ripper", "Flamespike the Crawler", "The Summoner", "Winged Death", "The Tormentor", "Taintbreeder",
            "Riftwraith the Cannibal", "Axe Dweller", "Anodized Elite", "Vinvear Molech", "Magma Torquer",
            "Ancient Barbarian 1", "Ancient Barbarian 2", "Ancient Barbarian 3", "Wisp Boss", "Expansion"}
# Bosses the map pieces place as plain monsters (MonStats Id, Levels Id): their MonStats classes and levels
BOSSES = [("andariel", 37), ("duriel", 73), ("mephisto", 102), ("diablo", 108), ("baalcrab", 132), ("izual", 105),
          ("bloodraven", 17), ("summoner", 74), ("hellbovine", 39)]
UBERS = [("uberandariel", 133), ("uberduriel", 134), ("uberizual", 135)]
# PD2's Corrupted Zone groups (Levels Ids), one zone at a time
ZONES = [[2, 8], [3, 9, 13], [4, 38], [5, 10, 14], [6, 11, 15], [7, 12, 16], [17, 18, 19], [21, 22, 23, 24, 25],
         [26, 27, 28], [29, 30, 31, 32, 33], [34, 35, 36, 37], [39], [41, 55, 59], [42, 56, 57, 60],
         [43, 62, 63, 64], [44, 58, 61, 65], [46, 66, 67, 68, 69, 70, 71, 72], [47, 48, 49, 51, 52, 53, 54], [74],
         [76, 84, 85], [77, 86, 87, 90], [78, 88, 89, 91], [79, 92, 93], [80, 94, 95], [81, 96, 97],
         [82, 83, 98, 99], [100, 101, 102], [104, 105], [106, 107], [108], [110, 111], [112, 113, 114],
         [115, 116, 117], [118, 119], [121, 122, 123, 124], [125, 126, 127], [128, 129, 130, 131]]
ZONE_AREAS = {a for g in ZONES for a in g}
ANCIENTS_AREA = 168  # the Uber Ancients' map area (its altar's drops: the area's level)
LUCION_CAPS = {0: 2, 1: 3, 2: 4}  # the vault's tier (PD2's 0-2, easiest first) -> LucionChestHigh's item limit
LUCION_CHESTS = 10  # chests in the vault's map piece (lucionvault.ds1), every tier

# Where a spot is. Fixed: its area is one of the game's preset maps (Levels DrlgType 2: the Cathedral, Tower Cellar
# Level 5, Nihlathak's Temple...), or an outdoor area laid out the same way every game (Travincal, the Chaos
# Sanctuary, the Bloody Foothills' strip of pieces) or a piece at the area's edge (Eldritch, Stormtree); the rest stand in a
# piece the level builder puts anywhere in the area. Waypoints: the areas to walk from the nearest waypoint (towns
# have one), over the game's area links (Levels Vis) and the links between outdoor areas, which the level builder
# makes (OUTDOOR; portals too: Tristram, the Cow Level, Nihlathak's Temple, Duriel's Lair from the true tomb).
FIXED_AREAS = {83, 108, 110}
FIXED_KEYS = {"Megaflow Rectifier", "Stormtree"}  # Eldritch: the piece by the Bloody Foothills; Stormtree: the
# Flayer Jungle's last piece, at its border with Lower Kurast (the author, 2026-10-31)
OUTDOOR = [(1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 26), (3, 17), (4, 38), (1, 39),
           (40, 41), (41, 42), (42, 43), (43, 44), (44, 45),
           (75, 76), (76, 77), (77, 78), (78, 79), (79, 80), (80, 81), (81, 82), (82, 83),
           (103, 104), (104, 105), (105, 106), (109, 110), (110, 111), (111, 112), (109, 121)] + \
          [(tomb, 73) for tomb in range(66, 73)]


def waypoint_distance(t):
    """{Levels Id: areas from the nearest waypoint}."""
    adj = {}

    def link(a, b):
        adj.setdefault(a, set()).add(b)
        adj.setdefault(b, set()).add(a)
    for lid, r in t.levels.items():
        for k in range(8):
            v = num(r.get(f"Vis{k}"))
            if v:
                link(int(lid), v)
    for a, b in OUTDOOR:
        link(a, b)
    dist = {int(lid): 0 for lid, r in t.levels.items() if r.get("Waypoint", "") not in ("", "255")}
    todo = list(dist)
    while todo:
        nxt = []
        for a in todo:
            for b in adj.get(a, ()):
                if b not in dist:
                    dist[b] = dist[a] + 1
                    nxt.append(b)
        todo = nxt
    return dist


# ---------------------------------------------------------------- one drop, six items at most

class Flow:
    """One drop with its item limit. For a class, T[c][c2] = the chance that a drop which has made c items so far has
    made c2 after the class, E[c] = {(item code, quality modifiers): expected count} the class adds from c."""

    def __init__(self, drops, cap=CAP):
        self.d, self.cap, self.memo = drops, cap, {}
        n = cap + 1
        self.ident = ([[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)], [{}] * n)

    def leaf(self, dist):
        n = self.cap + 1
        T = [[0.0] * n for _ in range(n)]
        for c in range(self.cap):
            T[c][c + 1] = 1.0
        T[self.cap][self.cap] = 1.0
        return T, [dist] * self.cap + [{}]

    def uniform(self, E):
        return all(E[c] is E[0] for c in range(self.cap))

    def compose(self, A, B):
        """A, then B in the same drop."""
        (TA, EA), (TB, EB) = A, B
        n = self.cap + 1
        T = [[sum(TA[i][k] * TB[k][j] for k in range(n)) for j in range(n)] for i in range(n)]
        bu = self.uniform(EB)
        E = []
        for c in range(n):
            acc = dict(EA[c])
            if bu:
                w = sum(TA[c][k] for k in range(self.cap))
                parts = [(w, EB[0])] if w else []
            else:
                parts = [(TA[c][k], EB[k]) for k in range(self.cap) if TA[c][k]]
            for w, e in parts:
                for key, v in e.items():
                    acc[key] = acc.get(key, 0.0) + w * v
            E.append(acc)
        return T, E

    def mix(self, parts):
        """One of the parts, with these chances."""
        n = self.cap + 1
        T = [[sum(w * P[0][i][j] for w, P in parts) for j in range(n)] for i in range(n)]
        if all(self.uniform(P[1]) for _, P in parts):
            acc = {}
            for w, P in parts:
                for key, v in P[1][0].items():
                    acc[key] = acc.get(key, 0.0) + w * v
            return T, [acc] * self.cap + [{}]
        E = []
        for c in range(n):
            acc = {}
            for w, P in parts:
                for key, v in P[1][c].items():
                    acc[key] = acc.get(key, 0.0) + w * v
            E.append(acc)
        return T, E

    def entries(self, name, mods):
        r = self.d.t.tcs[name]
        own = tuple(num(r.get(k)) for k in ("Unique", "Set", "Rare", "Magic"))
        mods = tuple(max(p, o) for p, o in zip(mods, own))
        ent = [(r["Item%d" % i].strip('"').split(",")[0], num(r.get("Prob%d" % i))) for i in range(1, 11)
               if r.get("Item%d" % i)]
        return mods, [(e, p) for e, p in ent if p > 0 and self.d.known(e)], num(r.get("Picks")) or 1, num(r.get("NoDrop"))

    def pick(self, name, mods=(0, 0, 0, 0)):
        """One pick of a class (its no-drop chance included)."""
        mods, ent, _, nodrop = self.entries(name, mods)
        tot = sum(p for _, p in ent) + nodrop
        parts = [(p / tot, self.node(e, mods)) for e, p in ent]
        if nodrop:
            parts.append((nodrop / tot, self.ident))
        return self.mix(parts)

    def node(self, name, mods=(0, 0, 0, 0)):
        key = (name, mods)
        if key in self.memo:
            return self.memo[key]
        d = self.d
        if name in d.auto:
            ent = d.auto[name]
            tot = sum(w for _, w in ent)
            res = self.leaf({(c, mods): w / tot for c, w in ent} if tot else {})
        elif name not in d.t.tcs:
            res = self.leaf({(name, mods): 1.0})
        else:
            mods2, ent, picks, _ = self.entries(name, mods)
            res = self.ident
            if picks < 0:
                left = -picks
                for e, p in ent:
                    for _ in range(min(p, left)):
                        res = self.compose(res, self.node(e, mods2))
                    left -= min(p, left)
            else:
                one = self.pick(name, mods)
                for _ in range(picks):
                    res = self.compose(res, one)
        self.memo[key] = res
        return res

    def per_drop(self, name):
        """({(code, mods): expected count} of one drop, [chance of 0..cap items])."""
        T, E = self.node(name)
        return E[0], T[0]


_SIM = {}


def simulate(d, name, cap, rng, mods=(0, 0, 0, 0), out=None):
    """One drop the way the game makes it, pick by pick: [(code, mods)] (for the self-test)."""
    out = [] if out is None else out
    if len(out) >= cap:
        return out
    if name in d.auto:
        ent = d.auto[name]
        x = rng.random() * sum(w for _, w in ent)
        for c, w in ent:
            x -= w
            if x < 0:
                out.append((c, mods))
                break
        return out
    if name not in d.t.tcs:
        out.append((name, mods))
        return out
    if name not in _SIM:
        r = d.t.tcs[name]
        ent = [(r["Item%d" % i].strip('"').split(",")[0], num(r.get("Prob%d" % i))) for i in range(1, 11)
               if r.get("Item%d" % i)]
        ent = [(e, p) for e, p in ent if p > 0 and d.known(e)]
        _SIM[name] = (tuple(num(r.get(k)) for k in ("Unique", "Set", "Rare", "Magic")), ent,
                      num(r.get("Picks")) or 1, sum(p for _, p in ent) + num(r.get("NoDrop")))
    own, ent, picks, tot = _SIM[name]
    mods = tuple(max(p, o) for p, o in zip(mods, own))
    if picks < 0:
        left = -picks
        for e, p in ent:
            for _ in range(min(p, left)):
                simulate(d, e, cap, rng, mods, out)
            left -= min(p, left)
        return out
    for _ in range(picks):
        x = rng.random() * tot
        for e, p in ent:
            x -= p
            if x < 0:
                simulate(d, e, cap, rng, mods, out)
                break
    return out


# ---------------------------------------------------------------- the spots

def level_of(t, cls, lid, diff):
    """A monster's level before the superunique bonus."""
    r = t.monstats[cls]
    if diff == 0:
        return num(r["Level"])
    if r.get("boss") == "1":
        return num(r["Level" + SUFFIX[diff]])
    return num(t.levels[str(lid)]["MonLvl%dEx" % (diff + 1)])


def clean(s):
    return re.sub(r"(Ã¿|ÿ)c.", "", s).strip()


def catalogue(t, d, strings):
    """Every farm spot: dict(id, name, diff, area, lid, lvl, tc, cap, unit, minions, gives, zone, kind, fixed, wp):
    gives = items the encounter always drops, fixed = its spot never moves (None: not a single monster's spot),
    wp = areas from the nearest waypoint."""
    ms, out = t.monstats, []
    area = lambda lid: clean(strings.get(t.levels[str(lid)]["LevelName"], t.levels[str(lid)]["LevelName"]))
    mon = lambda cls: clean(strings.get(ms[cls]["NameStr"], ms[cls]["NameStr"]))
    wps = waypoint_distance(t)

    def up(tc, cls, lv, diff):
        """Nightmare and Hell move a class up its group by monster level; Normal and boss-flagged monsters don't."""
        return d.upgrade(tc, lv) if diff and ms[cls].get("boss") != "1" else tc
    sus = {r["Superunique"]: r for r in t.superuniques if r.get("Superunique")}
    missing = set(sus) - set(PLACES) - UNPLACED
    assert not missing, f"superuniques with no place: {sorted(missing)}"

    def spot(**kw):
        kw.setdefault("cap", CAP)
        kw.setdefault("unit", "kill")
        kw.setdefault("minions", None)
        kw.setdefault("gives", {})
        kw.setdefault("zone", False)
        kw["id"] = f"{kw['key']}|{kw['diff']}" + ("|zone" if kw["zone"] else "")
        lid = kw.get("lid")
        if kw["kind"] in ("superunique", "boss") and lid:
            kw["fixed"] = (t.levels[str(lid)].get("DrlgType") == "2" or lid in FIXED_AREAS
                           or kw["key"] in FIXED_KEYS)
            kw["wp"] = wps.get(lid)
        else:
            kw["fixed"], kw["wp"] = None, None
        out.append(kw)

    for key, lid in PLACES.items():
        su = sus[key]
        cls = su["Class"]
        name = clean(strings.get(su["Name"], su["Name"]))
        m = ms[cls]["minion1"] if ms[cls].get("minion1") in ms else cls
        k = (num(su["MinGrp"]) + num(su["MaxGrp"])) / 2
        for diff in range(3):
            tc = su[("TC", "TC(N)", "TC(H)")[diff]]
            if not tc:
                continue
            for zone in (False, True):
                if zone and (diff != 2 or lid not in ZONE_AREAS or ms[cls].get("boss") == "1"
                             or level_of(t, cls, lid, 2) >= ZONE_LEVEL):
                    continue
                lv = (ZONE_LEVEL if zone else level_of(t, cls, lid, diff)) + SU_BONUS
                mtc = ms[m]["TreasureClass1" + SUFFIX[diff]]
                mlv = (ZONE_LEVEL if zone and ms[m].get("boss") != "1" else level_of(t, m, lid, diff)) + SU_BONUS
                spot(key=key, kind="superunique", name=name, diff=diff, lid=lid, area=area(lid), lvl=lv,
                     tc=up(tc, cls, lv, diff), zone=zone,
                     minions=(k, up(mtc, m, mlv, diff), mlv) if k and mtc else None)
    for cls, lid in BOSSES:
        for diff in range(3):
            tc = ms[cls]["TreasureClass1" + SUFFIX[diff]]
            for zone in (False, True):
                if zone and (diff != 2 or lid not in ZONE_AREAS or ms[cls].get("boss") == "1"
                             or level_of(t, cls, lid, 2) >= ZONE_LEVEL):
                    continue
                lv = ZONE_LEVEL if zone else level_of(t, cls, lid, diff)
                spot(key=cls, kind="boss" if ms[cls].get("boss") == "1" else "monster", name=mon(cls), diff=diff,
                     lid=lid, area=area(lid), lvl=lv, tc=up(tc, cls, lv, diff), zone=zone)
    for cls, lid in UBERS:
        spot(key=cls, kind="uber", name=mon(cls), diff=2, lid=lid, area=area(lid), lvl=num(ms[cls]["Level(H)"]),
             tc=ms[cls]["TreasureClass1(H)"])
    uni = {r["index"]: r for r in t.uniques}
    spot(key="uberdiablonew", kind="uber", name="Diablo Clone", diff=2, lid=None, area="", lvl=130, tc=None,
         gives={"Annihilus": 1.0})
    spot(key="ubertristram", kind="uber", name="Uber Tristram", diff=2, lid=136, area=area(136), lvl=130, tc=None,
         unit="run", gives={"Hellfire Torch": 1.0})
    alvl = num(t.levels[str(ANCIENTS_AREA)]["MonLvl3Ex"])
    for n in (1, 2, 3):
        spot(key=f"uberancients{n}", kind="uber", name=f"Uber Ancients ({n} ancient{'s' if n > 1 else ''})", diff=2,
             lid=ANCIENTS_AREA, area=area(ANCIENTS_AREA), lvl=alvl, tc="UberAncients", unit="run",
             count=(12 * n + 8) + (6 * n + 3) / 2)
    for tier, cap in LUCION_CAPS.items():
        spot(key=f"lucion{tier}", kind="uber", name=f"Lucion's vault, tier {tier}", diff=2, lid=189, area=area(189),
             lvl=CLVL, tc="LucionChestHigh", cap=cap, unit="vault", per=LUCION_CHESTS, low=("LucionChestLow", 3))
    assert "Annihilus" in uni and "Hellfire Torch" in uni
    return out


def gheed_offers(t):
    """{UniqueItems row number: expected offers per Gheed's map event shop}."""
    rows = t.uniques
    R = len(rows)
    acc = {}
    for n, r in enumerate(rows):
        if (r.get("enabled") == "1" and r.get("code") and r["code"] != "jew" and num(r.get("rarity")) > 0
                and 1 <= num(r.get("lvl")) <= 99):
            req = num(r.get("lvl req"))
            acc[n] = 1.0 if req < 60 else max(0.0, (159 - req) / 100)
    a = sum(acc.values()) / R
    slot = (1 - (1 - a) ** 10) / a
    slots = 5 - 1 / 200
    return {n: slots * v / R * slot for n, v in acc.items()}


def spot_rates(t, d, items, spots, mfs):
    """{spot id: {"named": {mf: [per item]}, "minions": {mf: [...]}}} per kill (run, chest, shop)."""
    cand = GM.candidates(items)
    N = len(items)
    by_index = {(it["kind"], it["index"]): i for i, it in enumerate(items)}
    flows = {}

    def flow(cap):
        if cap not in flows:
            flows[cap] = Flow(d, cap)
        return flows[cap]

    out = {}
    for s in spots:
        named, minions = {}, {}
        dists = []
        if s.get("count"):  # the altar: count items, each one pick of the class (picks that make nothing retried)
            T, E = flow(1).pick(s["tc"])
            q = sum(c * p for c, p in enumerate(T[0]))
            dists.append(({k: v * s["count"] / q for k, v in E[0].items()}, s["lvl"]))
        elif s.get("low"):
            dists.append((flow(s["low"][1]).per_drop(s["low"][0])[0], s["lvl"]))
            dists.append((flow(s["cap"]).per_drop(s["tc"])[0], s["lvl"]))
        elif s["tc"]:
            dists.append((flow(s["cap"]).per_drop(s["tc"])[0], s["lvl"]))
        mdist = flow(CAP).per_drop(s["minions"][1])[0] if s.get("minions") else None
        for mf in mfs:
            v = [0.0] * N
            for dist, lvl in dists:
                GM.add_drops(d, cand, dist, lvl, mf, s.get("per", 1), v)
            for name, k in s["gives"].items():
                v[by_index[("UNI", name)]] += k
            named[mf] = v
            if mdist is not None:
                w = [0.0] * N
                GM.add_drops(d, cand, mdist, s["minions"][2], mf, s["minions"][0], w)
                minions[mf] = w
        out[s["id"]] = {"named": named, "minions": minions}
    return out


def prepare(t, game_dir):
    """Add what the spots need to grail_map's tables; the game's strings."""
    import pd2_mpq
    mpq = pd2_mpq.MPQ(t.mpq_path)
    t.superuniques = pd2_data.read_table(mpq.read(BS.join(["data", "global", "excel", "SuperUniques.txt"]))
                                         .decode("latin-1"))
    return t.names


def load(game_dir):
    t = GM.Tables(game_dir)
    strings = prepare(t, game_dir)
    return t, GM.Drops(t), strings


# ---------------------------------------------------------------- gambling

GAMBLE_CLVLS = (1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 99)  # character levels the page offers


def gamble_tables(t):
    """The gamble list (Gamble.txt) and the gamble chances (DifficultyLevels: the same in every difficulty)."""
    import pd2_mpq
    mpq = pd2_mpq.MPQ(t.mpq_path)
    excel = lambda n: pd2_data.read_table(mpq.read(BS.join(["data", "global", "excel", n])).decode("latin-1"))
    codes = [r["code"] for r in excel("Gamble.txt") if r.get("code")]
    dl = excel("DifficultyLevels.txt")
    keys = ("GambleRare", "GambleSet", "GambleUnique", "GambleUber", "GambleUltra")
    vals = {k: num(dl[0][k]) for k in keys}
    assert all({k: num(r[k]) for k in keys} == vals for r in dl), "gamble chances differ by difficulty"
    return codes, vals


def gamble_price(t, code, clvl):
    """Gold for one gamble of the base at this character level (no reduced prices). Rings and amulets: their gamble
    cost; the rest: the base's normal version's cost, mixed with its exceptional and elite versions' costs by the
    character level, then scaled by character level and quality level."""
    it = t.items[t.items[code].get("normcode") or code] if t.items[code].get("normcode") in t.items else t.items[code]
    if it["code"] in ("rin", "amu"):
        return num(it.get("gamble cost"))
    trunc = lambda a, b: int(a / b)  # the game divides signed numbers toward zero
    stack = max(1, trunc(num(it.get("minstack")) + num(it.get("maxstack")), 2))
    u = x = uc = xc = 0
    for col, div in (("ubercode", 2), ("ultracode", 4)):
        c = it.get(col, "").strip()
        if c and c != "0" and c in t.items:
            k = max(0, trunc(100 * (clvl - num(t.items[c]["level"])), div) + 1)
            if col == "ubercode":
                u, uc = k, num(t.items[c]["cost"])
            else:
                x, xc = k, num(t.items[c]["cost"])
    base = u * uc + x * xc + stack * num(it["cost"]) * (10000 - x - u)
    lv, q = max(clvl, 5), num(it["level"])
    return trunc((trunc(2 * lv + 1, 3) + 20) * (trunc(base, 10000) + trunc(250 * (lv + max(q - 45, 0) - trunc(q, 2)), 3)), 15)


def gamble_rates(t, d, items, clvls=GAMBLE_CLVLS):
    """{clvl: {base code: (gold a gamble, {item number: chance a gamble})}}. A gambled item's item level is the
    character level - 5 to + 4 (5-99); the base becomes exceptional at (item level - its level) x GambleUber + 1 in
    10,000, else elite at (item level - its level) x GambleUltra + 1 in 10,000 (no try when the exceptional chance is
    0 or less); then unique at GambleUnique, set at GambleSet in 100,000, picked like a drop among the base's uniques
    or sets of level <= item level by weight (none: the roll is lost). Magic find plays no part."""
    codes, g = gamble_tables(t)
    cand = GM.candidates(items)
    out = {}
    for clvl in clvls:
        per = {}
        for b in codes:
            r = t.items[b]
            acc = {}
            for il in (min(99, max(5, clvl + k)) for k in range(-5, 5)):
                outcome = {b: 1.0}
                uber, ultra = r.get("ubercode", "").strip(), r.get("ultracode", "").strip()
                if uber in t.items:
                    cu = (il - num(t.items[uber]["level"])) * g["GambleUber"] + 1
                    if cu > 0:
                        pu = min(cu, 10000) / 10000
                        px = 0.0
                        if ultra in t.items:
                            cx = (il - num(t.items[ultra]["level"])) * g["GambleUltra"] + 1
                            px = min(cx, 10000) / 10000 if cx > 0 else 0.0
                        outcome = {uber: pu, ultra: (1 - pu) * px, b: (1 - pu) * (1 - px)} if px else {uber: pu, b: 1 - pu}
                for c, pc in outcome.items():
                    for kind, q in (("UNI", g["GambleUnique"]), ("SET", g["GambleSet"])):
                        cl = [(w, i) for l, w, i in cand[kind].get(c, []) if l <= il]
                        tot = sum(w for w, _ in cl)
                        for w, i in cl:
                            acc[i] = acc.get(i, 0) + 0.1 * pc * q / 100000 * w / tot
            per[b] = (gamble_price(t, b, clvl), acc)
        out[clvl] = per
    return out


# ---------------------------------------------------------------- for the page

GROUPS = ["Normal", "Nightmare", "Hell", "Corrupted Zones", "Ubers & events"]
KEEP = {0: 5, 1: 5, 2: 5, 3: 5, 4: 5}   # spots kept per item and group (and the best fixed spot)
B36 = "0123456789abcdefghijklmnopqrstuvwxyz"


def group_of(s):
    return 4 if s["kind"] == "uber" else 3 if s["zone"] else s["diff"]


def code(v, width=2):
    return "".join(B36[(v // 36 ** k) % 36] for k in range(width - 1, -1, -1))


def k_of(rate):
    """A rate as two base-36 characters: round(100 x (2 - log10 rate)), 1.2% steps; "zz" for never."""
    return code(1295) if rate <= 0 else code(max(0, min(1294, round(100 * (2 - math.log10(rate))))))


def pack(items, spots, rates, mfs, gheed):
    """The farm spots for the page: compact strings (see the template's decoder)."""
    ref = 300 if 300 in mfs else mfs[len(mfs) // 2]
    out_items = []
    for i in range(len(items)):
        keep = []
        for g, n in KEEP.items():
            cand = [(rates[s["id"]]["named"][ref][i], j) for j, s in enumerate(spots) if group_of(s) == g]
            cand = sorted([c for c in cand if c[0] > 0], key=lambda c: -c[0])
            chosen = [j for _, j in cand[:n]]
            if g < 3:  # the best of the group at every magic find too
                for mf in mfs:
                    best = max(cand, key=lambda c: rates[spots[c[1]]["id"]]["named"][mf][i], default=None)
                    if best and best[1] not in chosen:
                        chosen.append(best[1])
            if g < 4 and not any(spots[j]["fixed"] for j in chosen):  # the best spot that never moves
                best = next((j for _, j in cand if spots[j]["fixed"]), None)
                if best is not None:
                    chosen.append(best)
            keep += chosen
        s = ""
        for j in keep:
            r = rates[spots[j]["id"]]
            named = r["named"]
            enc = 10
            if r["minions"] and named[ref][i] > 0:
                enc = min(1295, round(10 * (named[ref][i] + r["minions"][ref][i]) / named[ref][i]))
            s += code(j) + "".join(k_of(named[mf][i]) for mf in mfs) + code(enc)
        out_items.append(s)
    out_spots = []
    for j, s in enumerate(spots):
        r = rates[s["id"]]["named"]
        out_spots.append([s["name"], s["diff"], s["area"], s["lvl"], s["unit"], group_of(s),
                          round(s["minions"][0], 1) if s.get("minions") else 0,
                          "".join(k_of(sum(r[mf])) for mf in mfs),
                          -1 if s["fixed"] is None else int(s["fixed"]), -1 if s["wp"] is None else s["wp"]])
    shop = {i: sum(gheed.get(u, 0) for u in it.get("uids", [])) for i, it in enumerate(items)}
    return {"groups": GROUPS, "spots": out_spots, "items": out_items, "ref": ref,
            "gheed": {str(i): k_of(v) for i, v in shop.items() if v > 0}}


def pack_gamble(t, items, rates):
    """Gambling for the page: the bases (code, name), each base's gold a gamble per character level, and per grail
    item its bases with the chance a gamble per character level (base index + a rate code per level)."""
    clvls = sorted(rates)
    bases = list(rates[clvls[0]])
    names = {r["code"]: r["name"] for r in pd2_data.read_table("".join(
        l for l in GM.BASES.read_text(encoding="utf-8").splitlines(True) if not l.startswith("#")))}
    per_item = [""] * len(items)
    for j, b in enumerate(bases):
        for i in sorted({i for l in clvls for i in rates[l][b][1]}):
            per_item[i] += code(j) + "".join(k_of(rates[l][b][1].get(i, 0)) for l in clvls)
    return {"clvls": clvls, "bases": [[b, names.get(b) or t.items[b].get("name", b)] for b in bases],
            "price": [[rates[l][b][0] for l in clvls] for b in bases], "items": per_item}


# ---------------------------------------------------------------- checks and printouts

def selftest(t, d):
    rng = random.Random(20261030)
    names = ["Duriel (H)", "Countess (H)", "Baal (H)", "Mephisto (H)", "Andariel (H)", "Nihlathak (H)",
             "Act 5 (H) Super Cx", "Cow King (H)", "Cow (H)", "Uber Andariel", "Act 1 Super C", "Council (H)"]
    ok = True
    for name in names:
        f = Flow(d)
        E, P = f.per_drop(name)
        runs = 40000
        counts = [0] * (CAP + 1)
        tally = {}
        for _ in range(runs):
            got = simulate(d, name, CAP, rng)
            counts[len(got)] += 1
            for code, mods in got:
                tally[code] = tally.get(code, 0) + 1
        exp_items = sum(c * p for c, p in enumerate(P))
        sim_items = sum(c * n for c, n in enumerate(counts)) / runs
        worst = 0.0
        byc = {}
        for (code, mods), v in E.items():
            byc[code] = byc.get(code, 0.0) + v
        for code, v in byc.items():
            if v * runs < 50:
                continue
            sd = math.sqrt(v * runs)
            z = (tally.get(code, 0) - v * runs) / sd
            worst = max(worst, abs(z))
        dist = " ".join(f"{p:.3f}/{n / runs:.3f}" for p, n in zip(P, counts))
        flag = "ok" if worst < 4.5 and abs(exp_items - sim_items) < 0.02 else "DIFFERS"
        ok &= flag == "ok"
        print(f"{name:22} items a drop {exp_items:.3f} (simulated {sim_items:.3f}); worst item z {worst:.1f}  {flag}")
        print(f"   0-6 items, model/simulated: {dist}")
    lin = d.expand("Duriel (H)")
    print(f"Duriel (H) without the limit: {sum(lin.values()):.2f} items a kill")
    return ok


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Grail farm spots: per kill, from the game's tables.")
    ap.add_argument("game_dir", help="the Diablo II folder (with ProjectD2)")
    ap.add_argument("--sources", action="store_true", help="print every spot")
    ap.add_argument("--item", help="an item's best spots")
    ap.add_argument("--spot", help="a spot's best grail items")
    ap.add_argument("--mf", type=int, default=300, help="magic find (default 300)")
    ap.add_argument("--selftest", action="store_true", help="check the six-item limit against a simulation")
    args = ap.parse_args()
    t, d, strings = load(args.game_dir)
    if args.selftest:
        sys.exit(0 if selftest(t, d) else 1)
    items = GM.grail_items(t)
    spots = catalogue(t, d, strings)
    if args.sources:
        for s in spots:
            extra = f" + {s['minions'][0]:g} minions ({s['minions'][1]} at {s['minions'][2]})" if s["minions"] else ""
            where = "" if s["fixed"] is None else f" {'fixed' if s['fixed'] else 'random'}, waypoint +{s['wp']}"
            print(f"{DIFFS[s['diff']]:9} {s['name']:32} {s['area']:28} lvl {s['lvl']:3} {s['tc'] or '-':24}"
                  f"{' ZONE' if s['zone'] else ''}{where}{extra}")
        return
    rates = spot_rates(t, d, items, spots, [args.mf])
    gheed = gheed_offers(t)
    if args.item:
        want = args.item.lower()
        for i, it in enumerate(items):
            if want not in it["name"].lower():
                continue
            print(f"{it['name']} ({it['base']}, level {it['lvl']}, {len(it['rows'])} table row(s)):")
            for diff in range(3):
                best = sorted(((r["named"][args.mf][i], s) for s in spots for r in [rates[s["id"]]]
                               if s["diff"] == diff and r["named"][args.mf][i] > 0), key=lambda x: -x[0])[:6]
                for v, s in best:
                    enc = v + (rates[s["id"]]["minions"][args.mf][i] if rates[s["id"]]["minions"] else 0)
                    print(f"   {DIFFS[diff]:9} 1 in {1 / v:12,.0f} {s['unit']}s  {s['name']} ({s['area']}, level "
                          f"{s['lvl']}){' [Corrupted Zone]' if s['zone'] else ''}  with minions 1 in {1 / enc:,.0f}")
            shop = sum(gheed.get(u, 0) for u in it.get("uids", []))
            if shop:
                print(f"   Gheed's map event: 1 in {1 / shop:,.0f} shops")
    if args.spot:
        want = args.spot.lower()
        for s in spots:
            if want not in s["name"].lower():
                continue
            v = rates[s["id"]]["named"][args.mf]
            top = sorted(range(len(items)), key=lambda i: -v[i])[:15]
            print(f"{DIFFS[s['diff']]} {s['name']} ({s['area']}, level {s['lvl']}, {s['tc']}): "
                  f"{sum(v):.4f} grail drops a {s['unit']}")
            for i in top:
                if v[i] > 0:
                    print(f"   1 in {1 / v[i]:10,.0f}  {items[i]['name']} ({items[i]['base']})")


if __name__ == "__main__":
    main()
