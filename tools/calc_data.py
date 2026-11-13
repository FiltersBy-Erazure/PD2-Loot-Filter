#!/usr/bin/env python3
"""
The game numbers of the website's calculators (Resources): Ohm vs Jewel, the Damage Calculator and Run Speed.
The pages are written by hand (website/resources/*.html); this writes only the DATA line between each page's
calc-data markers, from PD2's own tables, so a patch that changes weapons, affixes, runes, skills or animations
reaches the pages on the next run.

    python tools/calc_data.py "C:\\Users\\<you>\\Diablo II"             write each page's DATA line
    python tools/calc_data.py "C:\\Users\\<you>\\Diablo II" --check     change nothing; exit 1 if a page is out of date
    python tools/calc_data.py "C:\\Users\\<you>\\Diablo II" --selftest  check known values, then --check

It reads ProjectD2\\pd2data.mpq (Weapons, Gems, Skills, SkillDesc, CharStats and the string tables, through
tools/pd2_data.py's Game), ProjectD2\\pd2assets.mpq (AnimData.d2: every animation's length, speed and action frames),
docs/pd2-magic-affixes.tsv (the affixes, written by pd2_data.py --tier-data) and docs/pd2-attack-sequences.json (the
skills' animation sequences, the IAS Calculator's). Like tools/grail_map.py it needs the game files, so build.bat, the edit hook and CI
don't run it: rerun it after a PD2 patch, after pd2_data.py --extract.

How the game uses these numbers (the pages say it in their own words):
- An ethereal weapon's base damage is 5/4 of the table's, rounded down (each of its one-hand, two-hand and throw
  damages), before anything else.
- Enhanced damage on the weapon (its own, a superior base's, the runes and jewels in its sockets) adds up and
  raises only the weapon's base damage: base + base x ED / 100, rounded down; then the weapon's flat minimum and
  maximum damage are added.
- An attack's damage is the weapon's (plus flat damage from other gear), times (100 + the Strength and Dexterity
  bonus + skill, aura and mastery bonuses + enhanced damage from other gear) / 100, kept in 1/256ths of a point:
  no rounding until the monster's life goes down.
- Frames per attack are the game's character screen breakpoints (the advanced stats' "Breakpoints" lines): an
  animation of N frames at speed S, with total attack speed T = effective item IAS + skill IAS - weapon speed
  (between -85 and +75; skills that play a sequence 30 lower), takes ceil((N - start frame) x 256 / floor(S x
  (100 + T) / 100)) - 1 frames. Multi-hit attacks (Zeal, Fend, Fury, Strafe, Dragon Talon) rewind the animation
  between hits; a druid's wereform attack runs at a speed set by the weapon's own attack speed in human form.
"""
import argparse
import json
import re
import struct
import sys
from pathlib import Path

sys.dont_write_bytecode = True
TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
import pd2_data  # noqa: E402
import skill_calc  # noqa: E402

BS = chr(92)
START, END = "/* calc-data:start */", "/* calc-data:end */"
PAGES = {"ohm": ROOT / "website" / "resources" / "Ohm-vs-Jewel.html",
         "dmg": ROOT / "website" / "resources" / "Damage-Calculator.html",
         "frw": ROOT / "website" / "resources" / "Run-Speed.html"}
SEQ_FILE = ROOT / "docs" / "pd2-attack-sequences.json"
OHM = "r27"

# Weapon kinds as the pages list them: (key, label, item type, second type or None for any)
CATEGORIES = [
    ("axe1", "One-handed axes", "axe", "1han"), ("axe2", "Two-handed axes", "axe", "2han"),
    ("swd1", "One-handed swords", "swor", "1han"), ("swd1", "One-handed swords", "swor", "crys"),
    ("swd2", "Two-handed swords", "swor", "2hsw"),
    ("dag", "Daggers", "knif", None), ("club", "Clubs", "club", None), ("mace", "Maces", "mace", None),
    ("ham1", "One-handed hammers", "hamm", "1han"), ("ham2", "Two-handed hammers", "hamm", "2han"),
    ("scep", "Scepters", "scep", None), ("wand", "Wands", "wand", None), ("staf", "Staves", "staf", None),
    ("spea", "Spears", "spea", None), ("pole", "Polearms", "pole", None), ("pole", "Polearms", "sc9", None),
    ("jave", "Javelins", "jave", None), ("taxe", "Throwing axes", "taxe", None),
    ("tkni", "Throwing knives", "tkni", None), ("bow", "Bows", "bow", None), ("xbow", "Crossbows", "xbow", None),
    ("claw", "Claws (Assassin)", "h2h", None), ("claw", "Claws (Assassin)", "h2h2", None),
    ("orb", "Orbs (Sorceress)", "orb", None), ("abow", "Bows (Amazon)", "abow", None),
    ("aspe", "Spears (Amazon)", "aspe", None), ("ajav", "Javelins (Amazon)", "ajav", None),
]
TIERS = {"normal": "N", "exceptional": "X", "elite": "E"}
# The item types the pages test (masteries, skills' weapons): kept per weapon when it has them
TYPE_FLAGS = ["1han", "2han", "thro", "spea", "asm", "h2h", "miss", "knif", "swor", "axe", "blun", "jave", "bow",
              "xbow", "staf", "pole", "mele", "abow", "aspe", "ajav", "orb", "wand", "scep", "taxe", "tkni", "2hsw",
              "club", "mace", "hamm", "rod"]

# Classes: the code in Skills.txt, the animation token, the name, CharStats' row
CLASSES = [("ama", "AM", "Amazon"), ("sor", "SO", "Sorceress"), ("nec", "NE", "Necromancer"),
           ("pal", "PA", "Paladin"), ("bar", "BA", "Barbarian"), ("dru", "DZ", "Druid"), ("ass", "AI", "Assassin")]
ANIM_MODES = ["A1", "A2", "TH", "KK", "S1", "S2", "S3", "S4", "NU"]
WEAPON_CLASSES = ["HTH", "1HS", "1HT", "2HS", "2HT", "BOW", "XBW", "STF", "1JS", "1JT", "1SS", "1ST", "HT1", "HT2"]
WERE_FORMS = {"40": "Werewolf", "TG": "Werebear"}

# The attacks the Damage Calculator models. kind: normal (one animation), seq (a sequence), roll (an animation
# rewound between hits), ww (fixed frames between hits), charge, were (a wereform's animation), wereroll; dmg: the
# Skills.txt column with its damage bonus (the one its tooltip's "Damage" line shows; --selftest checks it); hits:
# column or number; roll: the rewind parameter; srcdam: the share of weapon damage (128 = all) comes from SrcDam
ATTACKS = [
    dict(k="attack", id=0, cls=None, kind="normal", mode="A1", label="Attack"),
    dict(k="throw", id=2, cls=None, kind="normal", mode="TH", dmg=None, throw=True, label="Throw"),
    dict(k="jab", id=10, cls="ama", kind="seq", dmg="calc1"),
    dict(k="fend", id=30, cls="ama", kind="roll", mode="A1", dmg="calc2", hits="calc1", roll="Param2"),
    dict(k="strafe", id=26, cls="ama", kind="roll", mode="A1", dmg="calc2", hits="calc1", roll="Param6", missile=True),
    dict(k="multishot", id=12, cls="ama", kind="normal", mode="A1", dmg="calc4", missile=True),
    dict(k="guided", id=22, cls="ama", kind="normal", mode="A1", dmg="calc1", missile=True),
    dict(k="dragonclaw", id=260, cls="ass", kind="seq", dmg="calc1"),
    dict(k="bladefury", id=266, cls="ass", kind="seq", dmg=None, missile=True),
    dict(k="bladedance", id=380, cls="ass", kind="ww", dmg="calc1"),
    dict(k="dragontalon", id=255, cls="ass", kind="roll", mode="KK", hits="calc1", roll=100, frames_only=True),
    dict(k="bash", id=126, cls="bar", kind="normal", mode="A1", dmg="calc1", flat="calc2"),
    dict(k="doubleswing", id=133, cls="bar", kind="seq", dmg="calc1", rate="Param5"),
    dict(k="frenzy", id=147, cls="bar", kind="seq", dmg="calc1"),
    dict(k="berserk", id=152, cls="bar", kind="seq", dmg="calc1"),
    dict(k="whirlwind", id=151, cls="bar", kind="ww", dmg="calc1"),
    dict(k="concentrate", id=144, cls="bar", kind="normal", mode="A1", dmg="calc1"),
    dict(k="doublethrow", id=140, cls="bar", kind="seq", dmg="calc1", throw=True),
    dict(k="splitthrow", id=375, cls="bar", kind="normal", mode="TH", dmg="calc4", throw=True),
    dict(k="stun", id=139, cls="bar", kind="normal", mode="A1", dmg=None),
    dict(k="wolfattack", id=0, cls="dru", kind="were", form="40", mode="A1", label="Attack (Werewolf)"),
    dict(k="bearattack", id=0, cls="dru", kind="were", form="TG", mode="A1", label="Attack (Werebear)"),
    dict(k="feralrage", id=232, cls="dru", kind="were", form="40", mode="A1", dmg="calc1"),
    dict(k="fury", id=248, cls="dru", kind="wereroll", form="40", mode="A1", dmg="calc2", hits="calc1", roll="Param2"),
    dict(k="maul", id=233, cls="dru", kind="were", form="TG", mode="A1", dmg=None),
    dict(k="zeal", id=106, cls="pal", kind="roll", mode="A1", dmg="calc2", hits="calc1", roll="Param2"),
    dict(k="sacrifice", id=96, cls="pal", kind="normal", mode="A1", dmg="calc1"),
    dict(k="charge", id=107, cls="pal", kind="charge", dmg="calc1"),
    dict(k="joust", id=378, cls="pal", kind="normal", mode="A1", dmg="calc1"),
    dict(k="smite", id=97, cls="pal", kind="normal", mode="S1", dmg="calc1", frames_only=True),
]
# The monsters the Damage Calculator offers as targets, by group (MonStats Id; None: grail_map's MAP_BOSSES of that
# tier, one boss per T1-T3 map). Life: Hell, one player: MinHP(H) / MaxHP(H) x MonLvl's L-HP(H) at the monster's own
# level (a boss keeps its own; above MonLvl's last row, that row) / 100, rounded down.
TARGETS = [
    ("Act bosses", ["andariel", "duriel", "mephisto", "diablo", "baalcrab"]),
    ("Pandemonium", ["uberandariel", "uberduriel", "uberizual", "ubermephisto", "uberdiablo", "uberbaal"]),
    ("Uber Ancients", ["uberancientbarb1", "uberancientbarb2", "uberancientbarb3"]),
    ("Diablo Clone, Rathma, Lucion", ["uberdiablonew", "rathmaBone", "rathmaPoison", "Lucion"]),
    ("Map bosses: Tier 1", 1), ("Map bosses: Tier 2", 2), ("Map bosses: Tier 3", 3),
    ("Tier 4 dungeons", ["willowispboss", "fingermageboss", "siegebeastMapBoss", "KanemithBoss", "RadamentBoss",
                         "SharpToothBoss"]),
    ("Unique maps", ["ZharTheMad", "WarlordOfBlood", "CityofUrehBoss", "NaKrulBoss", "DjinnDarkBoss", "DjinnLightBoss",
                     "ImperialPalaceBoss", "Iskatu", "Rakanoth"]),
    ("Map events", ["TombEventBoss"]),
]
TARGET_NAMES = {"uberbaal": "Uber Baal"}  # the game calls it Baal
# PD2's map boss lists (MonStats class ids: the rows in order, the "Expansion" row left out): T1, T2, T3, the unique
# maps, the T4 dungeons. A crushing blow takes 1/30 of their life left; any other boss's 1/(70 + 10 for each 1% of
# life it is missing). The Tainted Hive (Kyovoshad), Na-Krul, the Djinns and Zoltun Kulle are on none of them.
MAP_BOSS_CLASSES = {746, 750, 861, 870, 879, 893, 915, 996, 997, 1242, 800, 882, 884, 894, 963, 1025, 1026, 1149, 1240,
                    1243, 755, 809, 826, 883, 964, 998, 1121, 1122, 1058, 1060, 1061, 1062, 1063, 1094, 1096, 1148,
                    1164, 1166, 1174, 1175, 743, 1104, 1105, 747, 1000, 1103}
# Diablo Clone, Rathma, Mendeln and Lucion: their fight sets their life to 3/2 of it at tier 0, 4 x (1 + tier / 5) at
# tiers 1 and 2 (the page applies it)
TIERED = {"uberdiablonew", "rathmaBone", "rathmaPoison", "Lucion"}

# Skills the pages read besides the attacks (auras, buffs, masteries, curses, movement)
EXTRA_SKILLS = [98, 113, 122, 155, 150, 297, 236, 223, 228, 224, 147, 258, 148, 233, 232, 108, 9, 128, 134, 135, 252,
                19, 66, 87, 146, 152, 23, 97, 115, 46, 29, 242, 378, 151, 380, 106, 260, 255, 270, 275, 246]
SKILL_FIELDS = (["Id", "skill", "charclass", "HitShift", "EMin", "EMax", "ELen", "EDmgSymPerCalc", "ELenSymPerCalc",
                 "ToHit", "LevToHit", "ToHitCalc", "auralencalc", "anim", "seqnum", "SrcDam", "maxlvl", "itypea1",
                 "passiveitype", "reqlevel"]
                + [f"EMinLev{i}" for i in range(1, 6)] + [f"EMaxLev{i}" for i in range(1, 6)]
                + [f"ELevLen{i}" for i in range(1, 4)] + [f"Param{i}" for i in range(1, 9)]
                + [f"calc{i}" for i in range(1, 5)] + [f"aurastat{i}" for i in range(1, 7)]
                + [f"aurastatcalc{i}" for i in range(1, 7)] + [f"passivestat{i}" for i in range(1, 6)]
                + [f"passivecalc{i}" for i in range(1, 6)])


def num(text):
    text = (text or "").strip()
    return int(text) if text.lstrip("-").isdigit() else 0


def eth(d):
    """An ethereal weapon's base damage: 5/4 of the table's, rounded down."""
    return d * 5 // 4


def weapons(game):
    """Every spawnable weapon base (throwing potions aside) in the pages' kinds."""
    rows = pd2_data.read_table(game.pd2.read(BS.join(["data", "global", "excel", "Weapons.txt"])).decode("latin-1"))
    cats = {}
    for key, label, t1, t2 in CATEGORIES:
        cats.setdefault((t1, t2), (key, label))
    out = []
    for r in rows:
        code = r.get("code", "")
        if not code or r.get("spawnable") != "1" or r.get("type") == "tpot":
            continue
        kind = cats.get((r["type"], r.get("type2") or None)) or cats.get((r["type"], None))
        if not kind:
            raise SystemExit(f"calc_data: weapon {code} ({r['type']}/{r.get('type2')}) fits no kind: add it to CATEGORIES")
        anc = set(game.ancestors(code))
        w = {"code": code, "name": game.base_name(code), "tier": TIERS[game.tier(code)], "cat": kind[0],
             "lvl": num(r.get("levelreq")), "str": num(r.get("reqstr")), "dex": num(r.get("reqdex")),
             "wsm": num(r.get("speed")), "sb": num(r.get("StrBonus")), "db": num(r.get("DexBonus")),
             "wc": (r.get("wclass") or "").upper(), "it": [t for t in TYPE_FLAGS if t in anc]}
        if num(r.get("maxdam")):
            w["d1"] = [num(r["mindam"]), num(r["maxdam"])]
        if r.get("2handed") == "1" and num(r.get("2handmaxdam")):
            w["d2"] = [num(r["2handmindam"]), num(r["2handmaxdam"])]
            w["wc2"] = (r.get("2handedwclass") or r.get("wclass") or "").upper()
        if num(r.get("maxmisdam")):
            w["dt"] = [num(r["minmisdam"]), num(r["maxmisdam"])]
        if r.get("nodurability") != "1":
            w["eth"] = 1
        out.append(w)
    return out, [{"key": k, "label": label} for k, label in dict((k, l) for k, l, _, _ in CATEGORIES).items()]


def jewel_affixes():
    """The jewel affixes that add enhanced, minimum or maximum damage (one per affix group on a jewel)."""
    stat = {17: "ed", 18: "ed", 21: "min", 22: "max"}
    out = []
    lines = [l for l in pd2_data.MAGIC_AFFIXES_FILE.read_text(encoding="utf-8").splitlines() if not l.startswith("#")]
    head = lines[0].split("\t")
    for line in lines[1:]:
        r = dict(zip(head, line.split("\t")))
        if "jewl" not in r["itypes"].split(",") or r["spawnable"] != "1":
            continue
        mods = json.loads(r["mods"])
        kinds = {stat[s[0]] for m in mods for s in m[5] if s[0] in stat}
        if not kinds or len(mods) != 1:
            continue
        kind = kinds.pop()
        lo, hi = mods[0][3], mods[0][4]
        out.append({"name": r["name"], "side": r["kind"], "group": int(r["group"]), "stat": kind, "lo": lo, "hi": hi,
                    "alvl": num(r["level"]), "req": num(r["levelreq"]), "rare": r["rare"] in ("1", "3")})
    out.sort(key=lambda a: (a["side"], a["stat"], a["lo"]))
    return out


def ohm_ed(game):
    r = game.gems[OHM]
    for i in (1, 2, 3):
        if r.get(f"weaponMod{i}Code") == "dmg%":
            return {"name": game.strings.get(r.get("namestr", ""), r.get("name")), "ed": num(r[f"weaponMod{i}Min"])}
    raise SystemExit("calc_data: Ohm has no dmg% in its weapon mods")


def animations(game_dir):
    """AnimData.d2: name -> [frames, speed, first action frame] for the players' and wereforms' attack animations"""
    import pd2_mpq
    data = pd2_mpq.MPQ(Path(game_dir) / "ProjectD2" / "pd2assets.mpq").read(BS.join(["data", "global", "animdata.d2"]))
    recs, o = {}, 0
    for _ in range(256):
        n = struct.unpack_from("<I", data, o)[0]
        o += 4
        for _ in range(n):
            name = data[o:o + 8].split(b"\0")[0].decode()
            frames, speed = struct.unpack_from("<II", data, o + 8)
            act = [i for i, e in enumerate(data[o + 16:o + 160]) if e]
            recs[name] = [frames, speed, act[0] if act else -1]
            o += 160
    out = {}
    for tok in [c[1] for c in CLASSES]:
        for mode in ANIM_MODES:
            for wc in WEAPON_CLASSES:
                if tok + mode + wc in recs:
                    out[tok + mode + wc] = recs[tok + mode + wc]
    for tok in WERE_FORMS:
        for mode in ("NU", "A1", "A2", "S3", "S4"):
            out[tok + mode + "HTH"] = recs[tok + mode + "HTH"]
    return out


def sequences():
    """docs/pd2-attack-sequences.json (the IAS Calculator's: seqnum -> weapon class -> one [mode, frame, event] per
    step): seqnum -> weapon class -> [frames, number of hits (melee or missile events)]"""
    data = json.loads(SEQ_FILE.read_text(encoding="utf-8"))
    out = {}
    for sq, per in data.items():
        if sq.startswith("_"):
            continue
        for wc, steps in per.items():
            out.setdefault(sq, {})[wc.upper()] = [len(steps), sum(1 for s in steps if s[2] in (1, 2))]
    return out


def skill_rows(game, ids):
    """The Skills.txt fields the pages' formula evaluator reads, for these skills and every skill their formulas
    name (skill('Name'.key))"""
    by_name = {r["skill"].lower(): sid for sid, r in game.skill_rows.items()}
    todo, out = list(ids), {}
    while todo:
        sid = todo.pop()
        if sid in out or sid not in game.skill_rows:
            continue
        r = game.skill_rows[sid]
        row = {k: r[k] for k in SKILL_FIELDS if r.get(k, "").strip()}
        row["name"] = game.skill_names.get(sid, r["skill"])
        out[sid] = row
        for text in row.values():
            for name in re.findall(r"skill\('([^']+)'", str(text)):
                if name.lower() in by_name:
                    todo.append(by_name[name.lower()])
    return out


def targets(game):
    """the Damage Calculator's monsters: {k, n, g, lvl, hp: [min, max] in Hell for one player, res, kind, tier}"""
    import grail_map
    excel = lambda name: pd2_data.read_table(game.pd2.read(BS.join(["data", "global", "excel", name])).decode("latin-1"))
    rows, cls, k = {}, {}, 0
    for r in excel("MonStats.txt"):
        if not r.get("Id") or r["Id"] == "Expansion":
            continue
        rows[r["Id"]], cls[r["Id"]] = r, k
        k += 1
    levels = {int(r["Level"]): r for r in excel("MonLvl.txt") if r.get("Level", "").isdigit()}
    top = max(levels)
    out = []
    for group, ids in TARGETS:
        for mid in (list(grail_map.MAP_BOSSES[ids]) if isinstance(ids, int) else ids):
            r = rows[mid]
            assert r.get("boss") == "1", f"{mid} is no boss: the crushing blow divisor would be a monster's"
            lvl = num(r.get("Level(H)"))
            pct = num(levels[min(lvl, top)].get("L-HP(H)"))
            hp = [num(r.get("MinHP(H)")), num(r.get("MaxHP(H)"))]
            if r.get("noRatio") != "1":
                hp = [v * pct // 100 for v in hp]
            # a name's colour code (ÿc4, its bytes read as Latin-1 in some string tables) left out
            name = TARGET_NAMES.get(mid) or re.sub("(?:Ã¿|ÿ)c.", "",
                                                   game.keyed_strings.get(r.get("NameStr", ""), mid)).strip()
            out.append({"k": mid, "n": name, "g": group, "lvl": lvl, "hp": hp, "res": num(r.get("ResDm(H)")),
                        "kind": "mapboss" if cls[mid] in MAP_BOSS_CLASSES else "boss", "tier": mid in TIERED})
    return out


def damage_data(game, game_dir):
    ws, cats = weapons(game)
    attacks = []
    for a in ATTACKS:
        r = game.skill_rows[a["id"]]
        e = dict(a)
        e.setdefault("label", game.skill_names.get(a["id"], r["skill"]))
        e["srcdam"] = num(r.get("SrcDam")) or 128
        if e["kind"] == "seq":
            e["seq"] = num(r.get("seqnum"))
        e["itype"] = r.get("itypea1", "")
        attacks.append(e)
    ids = {a["id"] for a in ATTACKS} | set(EXTRA_SKILLS)
    return {"weapons": ws, "cats": cats, "classes": [{"code": c, "tok": t, "name": n} for c, t, n in CLASSES],
            "anim": animations(game_dir), "seq": sequences(), "attacks": attacks,
            "skills": skill_rows(game, ids), "targets": targets(game),
            "types": {t: [a for a in pd2_data_types(game, t)] for t in ("weap", "miss", "thro", "h2h", "asm", "mele")}}


def pd2_data_types(game, t):
    """the item types that count as `t` (t and every type whose ancestry has it)"""
    return sorted(code for code in game.type_rows if t == code or t in ancestors_of_type(game, code))


def ancestors_of_type(game, t):
    seen, todo = [], list(game.types.get(t, ("", "")))
    while todo:
        x = todo.pop(0)
        if x and x not in seen:
            seen.append(x)
            todo += list(game.types.get(x, ("", "")))
    return seen


def run_data(game):
    rows = skill_rows(game, [148, 147, 232, 242, 115, 378, 46, 29, 258, 151, 380])
    cls = []
    for code, tok, name in CLASSES:
        r = game.charstats.get(name, {})
        cls.append({"code": code, "name": name, "walk": num(r.get("WalkVelocity")), "run": num(r.get("RunVelocity"))})
    return {"skills": rows, "classes": cls}


def page_data(game, game_dir):
    ws, cats = weapons(game)
    return {"ohm": {"weapons": ws, "cats": cats, "jewels": jewel_affixes(), "ohm": ohm_ed(game)},
            "dmg": damage_data(game, game_dir), "frw": run_data(game)}


def written(text, data):
    i, j = text.index(START) + len(START), text.index(END)
    return text[:i] + "\n  const DATA = " + json.dumps(data, separators=(",", ":"), ensure_ascii=False) + ";\n  " + text[j:]


def selftest(game, data):
    bad = []
    ws = {w["code"]: w for w in data["ohm"]["weapons"]}

    def expect(what, got, want):
        if got != want:
            bad.append(f"{what}: {got} (want {want})")
    expect("Ogre Maul two-hand damage", ws["7m7"].get("d2"), [96, 132])
    expect("ethereal Ogre Maul", [eth(d) for d in ws["7m7"]["d2"]], [120, 165])
    expect("ethereal Ogre Maul at 600% (HarryPe's sheet)", [eth(d) + eth(d) * 600 // 100 for d in ws["7m7"]["d2"]],
           [840, 1155])
    expect("Highland Blade", (ws["7cm"].get("d1"), ws["7cm"].get("d2"), ws["7cm"]["sb"]), ([28, 78], [84, 120], 110))
    expect("Phase Blade can be ethereal", ws["7cr"].get("eth"), None)
    expect("Ohm", data["ohm"]["ohm"]["ed"], 45)
    best = max(a["hi"] for a in data["ohm"]["jewels"] if a["stat"] == "ed")
    expect("best jewel enhanced damage", best, 40)
    # skill formulas, as the tooltips show them
    S = skill_calc.Skills(list(game.skill_rows.values()))
    v = lambda sid, col, lvl, ctx=None: S.value(sid, game.skill_rows[sid][col], lvl, ctx)
    expect("Might 20 (self / party)", (v(98, "passivecalc1", 20), v(98, "aurastatcalc1", 20)), (420, 210))
    expect("Increased Speed 10 movement (HarryPe's sheet)", v(148, "passivecalc1", 10), 36)
    expect("Frenzy 26 movement (HarryPe's sheet)", v(147, "aurastatcalc1", 26), 64)
    expect("Battle Cry 1 / 20 / 22 physical resistance", [v(146, "aurastatcalc2", l) for l in (1, 20, 22)],
           [-5, -24, -26])
    expect("Amplify Damage 20 with 5 Curse Mastery", v(66, "aurastatcalc1", 20, {"blvl": {"curmas": 5}}), -36)
    # each attack's damage column is the one its tooltip's "Damage: ... percent" line shows
    desc = {}
    for r in pd2_data.read_table(game.pd2.read(BS.join(["data", "global", "excel", "SkillDesc.txt"])).decode("latin-1")):
        desc[r.get("skilldesc", "").lower()] = r
    for a in ATTACKS:
        if not a.get("dmg"):
            continue
        r = game.skill_rows[a["id"]]
        d = desc.get(r.get("skilldesc", "").lower(), {})
        lines = [d.get(f"desccalca{i}", "") for i in range(1, 18)
                 if game.keyed_strings.get(d.get(f"desctexta{i}", ""), "").strip() in ("Damage:", "Kick Damage:")
                 and "percent" in game.keyed_strings.get(d.get(f"desctextb{i}", ""), "")]
        col = a["dmg"]
        ok = any(x.replace(" ", "") in (r.get(col, "").replace(" ", ""), "clc" + col[-1]) for x in lines)
        if not ok:
            bad.append(f"{a['k']}: {col} = {r.get(col)!r} is not its tooltip's damage line {lines}")
    # frames: the game's character screen (BH's breakpoints) and the PD2 wiki agree with these
    anim = data["dmg"]["anim"]
    import math
    fpa = lambda name, tas, bonus=0: math.ceil((anim[name][0] - bonus) * 256 / (anim[name][1] * (100 + tas) // 100)) - 1
    expect("Amazon one-hand sword at 0 / 75 TAS", (fpa("AMA11HS", 0, 2), fpa("AMA11HS", 75, 2)), (13, 7))
    expect("Amazon crossbow at 0 (PD2's faster crossbows: 17)", fpa("AMA1XBW", 0), 17)
    seq = data["dmg"]["seq"]
    expect("Frenzy sequence", seq["11"]["1SS"], [17, 2])
    expect("Jab (PD2's) one / two hands", (seq["1"]["1HT"], seq["1"]["2HT"]), ([16, 3], [18, 3]))
    # the targets: life in Hell for one player, and the crushing blow kind PD2's map boss lists give
    tg = {t["k"]: t for t in data["dmg"]["targets"]}
    expect("Andariel (Hell)", (tg["andariel"]["lvl"], tg["andariel"]["hp"], tg["andariel"]["res"]), (85, [90937, 90937], 66))
    expect("Lilith", tg["uberandariel"]["hp"], [650000, 660000])
    expect("Uber Mephisto (level 120: MonLvl's last row)", tg["ubermephisto"]["hp"], [569500, 569500])
    expect("Diablo Clone", (tg["uberdiablonew"]["hp"], tg["uberdiablonew"]["tier"]), ([1053000, 1053000], True))
    expect("kinds", [tg[k]["kind"] for k in ("megademonboss", "CityofUrehBoss", "willowispboss", "KyovoshadBoss",
                                              "NaKrulBoss", "TombEventBoss", "uberdiablonew")],
           ["mapboss", "mapboss", "mapboss", "boss", "boss", "boss", "boss"])
    expect("map bosses per tier", [sum(t["g"] == f"Map bosses: Tier {n}" for t in tg.values()) for n in (1, 2, 3)],
           [10, 10, 9])
    return bad


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The calculators' game numbers (website Resources pages).")
    ap.add_argument("game_dir", help="the Diablo II folder (with ProjectD2)")
    ap.add_argument("--check", action="store_true", help="change nothing; exit 1 if a page is out of date")
    ap.add_argument("--selftest", action="store_true", help="check known values, then --check")
    args = ap.parse_args()
    game = pd2_data.Game(args.game_dir)
    data = page_data(game, args.game_dir)
    if args.selftest:
        bad = selftest(game, data)
        for b in bad:
            print("selftest:", b)
        print(f"selftest: {'FAILED' if bad else 'ok'}")
        if bad:
            sys.exit(1)
    stale = []
    for key, path in PAGES.items():
        if not path.exists():
            print(f"calc_data: {path.relative_to(ROOT)} doesn't exist yet: skipped")
            continue
        text = path.read_text(encoding="utf-8")
        new = written(text, data[key])
        if new != text:
            stale.append(path)
            if not (args.check or args.selftest):
                path.write_bytes(new.encode("utf-8"))
                print(f"calc_data: wrote {path.relative_to(ROOT)}")
    if args.check or args.selftest:
        for p in stale:
            print(f"calc_data: {p.relative_to(ROOT)} is out of date: run python tools/calc_data.py \"<Diablo II folder>\"")
        sys.exit(1 if stale else 0)
    if not stale:
        print("calc_data: every page up to date")


if __name__ == "__main__":
    main()
