#!/usr/bin/env python3
"""
The game numbers of the website's IAS Calculator (Resources: website/resources/IAS-Calculator.html): the page is
written by hand; this writes only its DATA line between the calc-data markers, from PD2's own files, so a patch that
changes animations, weapons or skills reaches the page on the next run.

    python tools/ias_data.py "C:\\Users\\<you>\\Diablo II"             write the page's DATA line
    python tools/ias_data.py "C:\\Users\\<you>\\Diablo II" --check     change nothing; exit 1 if the page is out of date
    python tools/ias_data.py "C:\\Users\\<you>\\Diablo II" --selftest  check known values, then --check

It reads ProjectD2\\pd2assets.mpq (AnimData.d2: every animation's frames, speed and attack frames), pd2data.mpq
(Weapons, ItemTypes, Skills and the strings, through tools/pd2_data.py's Game), docs/pd2-attack-sequences.json (the
sequence skills' steps), docs/pd2-unique-set-items.tsv and docs/pd2-runewords.tsv (items that grant another class's
attack skill). Like tools/calc_data.py it needs the game files, so build.bat, the edit hook and CI don't run it: rerun
it after a PD2 patch, after pd2_data.py --extract. CI checks the page's engine with tools/ias_selftest.py.

How the game turns IAS into frames (the page says it in its own words):
- Speed = 100 + skill speed (auras and skills that set attack rate) - the weapon's speed modifier (WSM) + effective
  IAS, where effective IAS = 120 x IAS / (120 + IAS), rounded toward zero; 30 less for a sequence skill; then kept
  between 15 and 175.
- Rate = the animation's base speed (256 for most) x speed / 100, rounded down; an attack of F frames that starts at
  frame S lasts ceil((F - S) x 256 / rate) - 1 frames when the attack is held. Amazons and Sorceresses start their
  normal attacks a frame or two in (S above).
- Dual wielding: only the weapon with the larger (-WSM + its own IAS) counts, its WSM and its IAS; on a tie the
  left-hand one. The other weapon's IAS counts nowhere.
- Werewolf and werebear forms: the form's base speed comes from the weapon. H = the class's own normal attack with
  that weapon, frames x 256 / ((100 - WSM + the weapon's own IAS, not diminished) x its speed / 100); no weapon: 19;
  base speed = the standing animation's frames x 256 / H.
"""
import argparse
import datetime
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
import pd2_mpq  # noqa: E402

BS = chr(92)
PAGE = ROOT / "website" / "resources" / "IAS-Calculator.html"
START, END = "/* calc-data:start */", "/* calc-data:end */"
SEQUENCES = ROOT / "docs" / "pd2-attack-sequences.json"
UNIQUES = ROOT / "docs" / "pd2-unique-set-items.tsv"
RUNEWORDS = ROOT / "docs" / "pd2-runewords.tsv"

# (key, class code in Skills.txt / ItemTypes, animation token)
CLASSES = [("ama", "Amazon", "AM"), ("sor", "Sorceress", "SO"), ("nec", "Necromancer", "NE"),
           ("pal", "Paladin", "PA"), ("bar", "Barbarian", "BA"), ("dru", "Druid", "DZ"), ("ass", "Assassin", "AI")]
FORMS = {"wolf": ("40", 223), "bear": ("TG", 228)}  # animation token, the form's skill
ATTACK_MODES = ("A1", "A2", "S1", "S2", "S3", "S4", "TH", "KK")
FORM_MODES = ("NU", "RN")  # the forms' standing and running animations (their attack's base speed)
# The weapon classes in the order the sequences list them
WCLASSES = ["hth", "1ht", "2ht", "1hs", "2hs", "bow", "xbw", "stf", "1js", "1jt", "1ss", "1st", "ht1", "ht2"]
# Amazons and Sorceresses start their normal attacks (A1, A2) this many frames in, by the weapon in hand; every other
# class at frame 0
START_FRAMES = {cls: {"hth": 1, "1hs": 2, "1ht": 2, "stf": 2, "2hs": 2, "2ht": 2, "bow": 0, "xbw": 0, "ht1": 0}
                for cls in ("ama", "sor")}
# The weapon kinds of the Type list, first match on the base's item types
KINDS = [("abow", "Amazon bows"), ("aspe", "Amazon spears"), ("ajav", "Amazon javelins"), ("h2h", "Claws"),
         ("orb", "Orbs"), ("tkni", "Throwing knives"), ("taxe", "Throwing axes"), ("jave", "Javelins"),
         ("knif", "Daggers"), ("axe", "Axes"), ("swor", "Swords"), ("spea", "Spears"), ("pole", "Polearms"),
         ("club", "Clubs"), ("mace", "Maces"), ("hamm", "Hammers"), ("scep", "Scepters"), ("wand", "Wands"),
         ("staf", "Staves"), ("bow", "Bows"), ("xbow", "Crossbows")]
# Skills whose attack repeats in one animation, by rolling it back (the % of the swing it rolls back)
ROLLBACK = {26: "Param6", 30: "Param2", 106: "Param2", 248: "Param2", 255: 100}
FIXED_FRAMES = (151, 380)  # Whirlwind and Blade Dance: one hit every Param3 frames, whatever the IAS
CHARGE = 107
LEVELS = 60


class Archives:
    """PD2's archives before the base game's, as the game reads them."""

    def __init__(self, folder):
        d = Path(folder)
        names = [d / "ProjectD2" / n for n in ("pd2assets.mpq", "pd2data.mpq", "patch_d2.mpq")]
        names += [d / n for n in ("d2exp.mpq", "d2char.mpq", "d2data.mpq")]
        self.names, self.mpqs = names, {}

    def read(self, *parts):
        name = BS.join(parts)
        for path in self.names:
            if path not in self.mpqs:
                self.mpqs[path] = pd2_mpq.MPQ(str(path))
            try:
                return self.mpqs[path].read(name)
            except KeyError:
                pass
        raise KeyError(name)


def animdata(arch):
    """{name: (frames, speed, [frames with an attack or missile event])} from AnimData.d2."""
    b = arch.read("data", "global", "AnimData.d2")
    out, off = {}, 0
    for _ in range(256):
        n = struct.unpack_from("<I", b, off)[0]
        off += 4
        for _ in range(n):
            name = b[off:off + 8].split(b"\0")[0].decode("latin-1").upper()
            frames, speed = struct.unpack_from("<II", b, off + 8)
            ev = b[off + 16:off + 16 + min(frames, 144)]
            out[name] = (frames, speed, [i for i, e in enumerate(ev) if e in (1, 2)])
            off += 160
    if off != len(b):
        raise SystemExit(f"ias_data: AnimData.d2 read {off} of {len(b)} bytes: its layout changed")
    return out


# ---------------------------------------------------------------- Skills.txt calcs (integer math, as the game)

def tdiv(a, b):
    """C division: rounded toward zero."""
    q = abs(a) // abs(b)
    return q if (a >= 0) == (b > 0) else -q


def dm(lvl, lo, hi):
    """The skills' diminishing curve: lo + (hi - lo) x (110 x lvl / (lvl + 6)) / 100, at most hi."""
    v = tdiv(tdiv(110 * lvl, lvl + 6) * (hi - lo), 100) + lo
    return min(v, hi)


class Calc:
    TOKEN = re.compile(r"\s*(?:(\d+)|([A-Za-z_][A-Za-z0-9_]*)|('[^']*'\.[A-Za-z0-9_]+)|(.))")

    def __init__(self, text, row):
        self.text, self.row = text.replace('"', "").strip(), row  # a table's quotes around a calc
        self.toks = []
        for num, name, ref, op in self.TOKEN.findall(self.text):
            self.toks.append(("n", int(num)) if num else ("i", name) if name else ("r", ref) if ref else ("o", op))

    def par(self, n):
        v = self.row.get(f"Param{n}", "").strip()
        return int(v) if v.lstrip("-").isdigit() else 0

    def value(self, lvl, blvl):
        self.lvl, self.blvl, self.i = lvl, blvl, 0
        v = self.expr()
        if self.i != len(self.toks):
            raise SystemExit(f"ias_data: can't read the calc {self.text!r}")
        return v

    def peek(self):
        return self.toks[self.i] if self.i < len(self.toks) else (None, None)

    def take(self, op):
        if self.peek() == ("o", op):
            self.i += 1
            return True
        return False

    def expr(self):
        v = self.term()
        while True:
            if self.take("+"):
                v += self.term()
            elif self.take("-"):
                v -= self.term()
            else:
                return v

    def term(self):
        v = self.unary()
        while True:
            if self.take("*"):
                v *= self.unary()
            elif self.take("/"):
                v = tdiv(v, self.unary())
            else:
                return v

    def unary(self):
        if self.take("-"):
            return -self.unary()
        if self.take("("):
            v = self.expr()
            if not self.take(")"):
                raise SystemExit(f"ias_data: no ) in the calc {self.text!r}")
            return v
        kind, val = self.peek()
        self.i += 1
        if kind == "n":
            return val
        if kind == "i":
            name = val.lower()
            if name in ("min", "max"):
                if not self.take("("):
                    raise SystemExit(f"ias_data: {name} without ( in {self.text!r}")
                a = self.expr()
                if not self.take(","):
                    raise SystemExit(f"ias_data: {name} without , in {self.text!r}")
                b = self.expr()
                self.take(")")
                return min(a, b) if name == "min" else max(a, b)
            if name == "skill":  # a synergy: skill('X'.blvl); the page counts none
                self.take("(")
                self.i += 1
                self.take(")")
                return 0
            if name == "lvl":
                return self.lvl
            if name == "blvl":
                return self.blvl
            m = re.fullmatch(r"par(\d)", name)
            if m:
                return self.par(int(m.group(1)))
            m = re.fullmatch(r"(dm|ln)(\d)(\d)", name)
            if m:
                a, b = self.par(int(m.group(2))), self.par(int(m.group(3)))
                return dm(self.lvl, a, b) if m.group(1) == "dm" else a + (self.lvl - 1) * b
        raise SystemExit(f"ias_data: can't read {val!r} in the calc {self.text!r}")


def calc(row, text, lvl, blvl=None):
    return Calc(text, row).value(lvl, lvl if blvl is None else blvl)


def stat_calc(row, stat, kinds=("aurastat", "passivestat")):
    """The calc a skill row gives a stat (aurastatN / aurastatcalcN, passivestatN / passivecalcN)."""
    for kind in kinds:
        for n in range(1, 7):
            if row.get(f"{kind}{n}", "").strip() == stat:
                return row.get(f"{kind}calc{n}" if kind == "aurastat" else f"passivecalc{n}", "").strip()
    return None


# ---------------------------------------------------------------- the page's data

def types_of(game, codes):
    """Every item type the bases' ancestry reaches: {type: [parents]}, and the class each is restricted to."""
    tree, cls = {}, {}
    todo = [t for c in codes for t in game.base_type.get(c, ()) if t]
    while todo:
        t = todo.pop()
        if t in tree or t not in game.types:
            continue
        tree[t] = [p for p in game.types[t] if p]
        todo += tree[t]
        c = game.type_rows[t].get("Class", "").strip()
        if c:
            cls[t] = c
    return tree, cls


def weapons(game):
    """Every weapon base a character can hold (spawnable, or the base of a unique, set item or runeword)."""
    item_bases = set()
    for line in UNIQUES.read_text(encoding="utf-8").splitlines():
        cols = line.split("\t")
        if len(cols) > 3 and cols[0] in ("UNI", "SET"):
            item_bases.add(cols[3])
    lines = [l for l in RUNEWORDS.read_text(encoding="utf-8").splitlines() if l and not l.startswith("#")]
    head = lines[0].split("\t")
    for line in lines[1:]:
        cols = dict(zip(head, line.split("\t")))
        item_bases.update(b[0] for b in json.loads(cols.get("bases") or "[]"))
    rows = pd2_data.read_table(game.pd2.read(BS.join(["data", "global", "excel", "Weapons.txt"])).decode("latin-1"))
    out = []
    for r in rows:
        code = r.get("code", "")
        if not code or r.get("type") == "tpot" or not (r.get("spawnable") == "1" or code in item_bases):
            continue
        anc = game.ancestors(code)
        kind = next((k for k, _ in KINDS if k in anc), None)
        if not kind:
            raise SystemExit(f"ias_data: weapon {code} ({r['type']}) fits no kind: add it to KINDS")
        flags = (1 if r.get("1or2handed") == "1" else 0) | (2 if r.get("2handed") == "1" else 0) | \
            (4 if "thro" in anc else 0)
        out.append({"c": code, "n": game.base_name(code), "t": game.tier(code)[0].upper(), "k": kind,
                    "w": int(r.get("speed") or 0), "wc": r["wclass"].strip(), "wc2": r["2handedwclass"].strip(),
                    "f": flags, "ty": [x for x in (r.get("type"), r.get("type2")) if x],
                    "g": r.get("alternateGfx", "").strip().upper(), "lv": int(r.get("levelreq") or 0)})
    names = {}
    for w in out:
        names.setdefault(w["n"], []).append(w)
    for same in names.values():  # the 2H Phase Blade shares its name with the Phase Blade
        if len(same) > 1:
            for w in same:
                if w["f"] & 2 and not w["f"] & 1:
                    w["n"] += " (two-handed)"
    return out


def tsv_rows(path):
    lines = [l for l in path.read_text(encoding="utf-8").splitlines() if l and not l.startswith("#")]
    head = lines[0].split("\t")
    return [dict(zip(head, l.split("\t"))) for l in lines[1:]]


def ias_in(groups):
    """The most IAS a props list ([[["IAS", lo, hi]], ...]) gives."""
    return sum(max(hi for code, lo, hi in g if code == "IAS") for g in groups if any(c == "IAS" for c, _, _ in g))


def weapon_ias_caps(game, bases):
    """The most IAS each base's weapon can carry, for the forms' fastest setups, and how: a crafted weapon (its craft's
    IAS and its best IAS affix) or its best unique or set item, either with Shael runes in the sockets Larzuk's
    Puzzlebox can give it and the attack speed corruption, or with Shael in the sockets a corruption can give it
    instead; or its best runeword (its own and its runes' IAS; runewords can't be corrupted)."""
    corrupt = max((ias_in(json.loads(r["props"] or "[]")) for r in tsv_rows(ROOT / "docs" / "pd2-corruptions.tsv")
                   if r["input"].split(",")[0] == "weap"), default=0)
    craft = max((ias_in(json.loads(r["props"])) for r in tsv_rows(ROOT / "docs" / "pd2-crafts.tsv") if r["type"] == "weap"),
                default=0)
    shael = next(int(game.gems["r13"][f"weaponMod{i}Max"] or 0) for i in (1, 2, 3)
                 if game.gems["r13"].get(f"weaponMod{i}Code", "").startswith("swing"))
    maxsock = {r["code"]: int(r["maxsock41"] or 0) for r in tsv_rows(ROOT / "docs" / "pd2-bases.tsv")}
    affixes = []
    for r in tsv_rows(pd2_data.MAGIC_AFFIXES_FILE):
        if r["spawnable"] != "1" or not (r["frequency"] or "0").isdigit() or int(r["frequency"] or 0) <= 0:
            continue
        ias = max((m[4] for m in json.loads(r["mods"]) for s in m[5] if s[0] == 93), default=0)
        if ias:
            affixes.append((ias, set(filter(None, r["itypes"].split(","))), set(filter(None, r["etypes"].split(",")))))
    items = {}
    for r in tsv_rows(UNIQUES):
        if r["kind"] in ("UNI", "SET"):
            items[r["code"]] = max(items.get(r["code"], 0), ias_in(json.loads(r["props"] or "[]")))
    runewords = {}
    for r in tsv_rows(RUNEWORDS):
        ias = ias_in(json.loads(r["props"] or "[]")) + ias_in(json.loads(r["runestats"] or "[]"))
        for b in json.loads(r["bases"] or "[]"):
            runewords[b[0]] = max(runewords.get(b[0], 0), ias)
    out = {}
    for b in bases:
        anc = set(game.ancestors(b["c"]))
        best = max((ias for ias, it, et in affixes if it & anc and not et & anc), default=0)
        big = bool(anc & {"2han", "bow", "xbow"})
        cap = maxsock.get(b["c"], 0)
        # Larzuk's Puzzlebox: 2-4 sockets in a two-handed melee weapon, bow or crossbow, 1-2 in the others; a
        # corruption: up to 6 sockets in those, 4 in the others; both at most the base's own
        puzzle, corr_socks = min(4 if big else 2, cap), min(6 if big else 4, cap)
        ways = []
        for own, what in [(craft + best, "crafted")] + ([(items[b["c"]], "its best unique or set item")] if b["c"] in items else []):
            ways.append((own + puzzle * shael + corrupt,
                         f"{what} ({own}) + {puzzle} Shael in Larzuk's Puzzlebox sockets + corruption {corrupt}" if puzzle
                         else f"{what} ({own}) + corruption {corrupt}"))
            if corr_socks:
                ways.append((own + corr_socks * shael, f"{what} ({own}) + a corruption's {corr_socks} sockets, all Shael"))
        if b["c"] in runewords:
            ways.append((runewords[b["c"]], f"its best runeword ({runewords[b['c']]})"))
        out[b["c"]] = max(ways)
    return out


def skill_name(game, sid):
    return game.skill_names.get(sid) or game.skill_rows[sid]["skill"]


def attack_skills(game, wanted):
    """The attack skills the page lists: every class's skills drawn with an attack animation (casting sequences
    aside), and the ones items grant to every class (wanted)."""
    seqs = json.loads(SEQUENCES.read_text(encoding="utf-8"))
    keys = {k for k, _, _ in CLASSES}
    desc = pd2_data.read_table(game.pd2.read(BS.join(["data", "global", "excel", "SkillDesc.txt"])).decode("latin-1"))
    page = {r["skilldesc"]: r.get("SkillPage", "").strip() for r in desc if r.get("skilldesc")}
    out, used_seqs = [], set()
    for sid, r in sorted(game.skill_rows.items()):
        cls = r.get("charclass", "").strip()
        mode = r.get("anim", "").strip()
        on_tree = page.get(r.get("skilldesc", "").strip(), "") not in ("", "0")
        if not (cls in keys and on_tree) and sid not in wanted:
            continue  # not a class's skill (365 Shattering Arrow: on no skill tree, Freezing Arrow's helper)
        if mode not in ATTACK_MODES + ("SQ",) or not r.get("skilldesc", "").strip():
            continue
        if "temp" in r["skill"].lower():
            continue
        if r.get("range", "").strip() == "none" and not r.get("SrcDam", "").strip() and not r.get("EType", "").strip():
            continue  # no damage: a movement (Leap)
        seq = r.get("seqnum", "").strip() if mode == "SQ" else ""
        if seq:
            steps = seqs.get(seq, {})
            if not steps or all(s[0][0] == "SC" for s in steps.values()):
                continue  # drawn with the casting animation: cast speed, not attack speed
            used_seqs.add(seq)
        s = {"id": sid, "n": skill_name(game, sid), "c": cls, "m": mode, "q": int(seq) if seq else 0}
        for side in ("a", "b"):
            s["i" + side] = [r[f"itype{side}{i}"].strip() for i in (1, 2, 3) if r.get(f"itype{side}{i}", "").strip()]
            s["e" + side] = [r[f"etype{side}{i}"].strip() for i in (1, 2) if r.get(f"etype{side}{i}", "").strip()]
        s["ws"] = int(r.get("weapsel") or 0)
        restrict = int(r.get("restrict") or 0)
        states = [r[f"State{i}"].strip() for i in (1, 2, 3) if r.get(f"State{i}", "").strip()]
        s["fm"] = [f for f in ("wolf", "bear") if f in states] if restrict == 2 else ["human"]
        if sid in ROLLBACK:
            rb = ROLLBACK[sid]
            s["rb"] = rb if isinstance(rb, int) else int(r[rb] or 0)
            s["hits"] = [calc(r, r["calc1"], lvl) for lvl in range(1, LEVELS + 1)]
            if sid == 26:  # Strafe: at least calc3 arrows, at most calc1, one per target in range
                s["hmin"] = [min(calc(r, r["calc3"], lvl), s["hits"][lvl - 1]) for lvl in range(1, LEVELS + 1)]
        if sid in FIXED_FRAMES:
            s["ff"] = int(r["Param3"] or 0)
        if sid == CHARGE:
            s["chg"] = int(r["Param6"] or 0)
        ar = stat_calc(r, "attackrate", ("aurastat",))
        if ar and r.get("aurastate", "").strip() == "temp_skill_buff":
            s["ar"] = calc(r, ar, 1)  # Double Swing, Dragon Tail, Split Throw: for their own attack
        out.append(s)
    return out, {k: v for k, v in seqs.items() if k in used_seqs}


def speed_skills(game):
    """Attack speed per level 1..60 from the speed skills (hard points where the game counts only those)."""
    row = {sid: game.skill_rows[sid] for sid in (122, 147, 223, 258, 148)}
    hustle = next(r for r in game.skill_rows.values() if r["skill"] == "Quickness SelfAura")
    lv = range(1, LEVELS + 1)
    return {"fana": [calc(row[122], stat_calc(row[122], "attackrate"), n) for n in lv],
            "frenzy": [calc(row[147], stat_calc(row[147], "attackrate"), n) for n in lv],
            "wolf": [calc(row[223], stat_calc(row[223], "attackrate"), n) for n in lv],
            "bos": [calc(row[258], stat_calc(row[258], "attackrate"), n, n) for n in lv],
            "inc": [calc(row[148], stat_calc(row[148], "item_fasterattackrate"), n, n) for n in lv],
            "hustle": calc(hustle, stat_calc(hustle, "attackrate"), 6, 0)}


def item_oskills(skill_ids):
    """[skill id, item name, kind, lowest level, highest level] for items that grant one of skill_ids."""
    out = []
    for path, kind_col, props_col, name_col in ((UNIQUES, 0, 7, 1), (RUNEWORDS, 0, 9, 1)):
        lines = [l for l in path.read_text(encoding="utf-8").splitlines() if l and not l.startswith("#")]
        head = lines[0].split("\t")
        for line in lines[1:]:
            cols = dict(zip(head, line.split("\t")))
            kind = {"UNI": "unique", "SET": "set item", "RW": "runeword"}.get(cols["kind"])
            if not kind:
                continue
            for group in json.loads(cols["props"] or "[]"):
                for code, lo, hi in group:
                    m = re.fullmatch(r"OS(\d+)", code)
                    if m and int(m.group(1)) in skill_ids:
                        out.append([int(m.group(1)), cols["name"], kind, lo, hi])
    seen, uniq = set(), []
    for o in out:
        key = (o[0], o[1])
        if key not in seen:
            seen.add(key)
            uniq.append(o)
    return uniq


def page_data(game, arch):
    anims = animdata(arch)
    tokens = [t for _, _, t in CLASSES]
    a = {}
    for name, (frames, speed, hits) in sorted(anims.items()):
        tok, mode = name[:2], name[2:4]
        if (tok in tokens or tok in ("40", "TG")) and mode in ATTACK_MODES or \
                tok in ("40", "TG") and mode in FORM_MODES or tok in tokens and mode == "RN":
            a[name] = [frames, speed, hits]
    bases = weapons(game)
    caps = weapon_ias_caps(game, bases)
    for b in bases:
        b["m"], b["mh"] = caps[b["c"]]
    tree, tcls = types_of(game, [b["c"] for b in bases] + ["buc"])
    oskill_ids = {sid for sid, r in game.skill_rows.items() if r.get("anim", "").strip() in ATTACK_MODES + ("SQ",)}
    os_ = item_oskills(oskill_ids)
    skills, seqs = attack_skills(game, {o[0] for o in os_})
    listed = {s["id"] for s in skills}
    os_ = [o for o in os_ if o[0] in listed]
    return {"v": datetime.date.today().isoformat(),
            "cls": [list(c) for c in CLASSES], "wcs": WCLASSES, "fb": START_FRAMES,
            "a": a, "types": tree, "tcls": tcls, "kinds": [list(k) for k in KINDS], "b": bases,
            "sk": skills, "sq": seqs, "sp": speed_skills(game), "os": os_,
            "forms": {f: {"t": t, "skill": sid} for f, (t, sid) in FORMS.items()}}


def written(text, data):
    i, j = text.index(START) + len(START), text.index(END)
    js = json.dumps(data, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/")
    return text[:i] + "\n  const DATA = " + js + ";\n  " + text[j:]


def selftest(data):
    bad = []

    def expect(what, got, want):
        if got != want:
            bad.append(f"{what}: {got} (want {want})")
    a = data["a"]
    expect("Barbarian two-handed sword attack", a.get("BAA12HS"), [18, 256, [8]])
    expect("Barbarian one-handed sword attack", a.get("BAA11HS"), [16, 256, [7]])
    expect("Amazon crossbow (PD2's faster crossbows)", a.get("AMA1XBW"), [20, 294, [9]])
    expect("werewolf attack", a.get("40A1HTH"), [13, 256, [7]])
    expect("werewolf standing", a.get("40NUHTH", [0])[0], 9)
    expect("werebear standing", a.get("TGNUHTH", [0])[0], 10)
    expect("attack animations", sum(1 for k in a if k[2:4] in ATTACK_MODES), 292)
    b = {w["c"]: w for w in data["b"]}
    expect("Colossus Blade", [b["7gd"][k] for k in ("w", "wc", "wc2", "f")], [5, "1hs", "2hs", 3])
    expect("Phase Blade", [b["7cr"][k] for k in ("w", "wc")], [-30, "1hs"])
    expect("2H Phase Blade", [b["7cr2"][k] for k in ("n", "wc", "k")], ["Phase Blade (two-handed)", "2hs", "swor"])
    expect("Feral Claws", [b["7lw"][k] for k in ("w", "wc", "k")], [-20, "ht1", "h2h"])
    sp = data["sp"]
    expect("Fanaticism levels 1 / 20 / 40", [sp["fana"][i - 1] for i in (1, 20, 40)], [14, 35, 38])
    expect("Werewolf levels 1 / 20", [sp["wolf"][i - 1] for i in (1, 20)], [20, 68])
    expect("Frenzy levels 1 / 20", [sp["frenzy"][i - 1] for i in (1, 20)], [7, 42])
    expect("Burst of Speed hard points 1 / 20", [sp["bos"][i - 1] for i in (1, 20)], [22, 53])
    expect("Increased Speed IAS at 10", sp["inc"][9], 20)
    expect("Hustle's Burst of Speed", sp["hustle"], 15)
    sk = {s["id"]: s for s in data["sk"]}
    expect("Jab's sequence (PD2's own, one-handed)", len(data["sq"]["1"]["1ht"]), 16)
    expect("Zeal hits", sk[106]["hits"][:3], [3, 3, 3])
    expect("Strafe hits at 1 / 4", [sk[26]["hits"][0], sk[26]["hits"][3]], [2, 5])
    expect("Whirlwind frames", sk[151].get("ff"), 6)
    expect("Double Swing speed", sk[133].get("ar"), 50)
    expect("Dragon Tail speed", sk[270].get("ar"), -20)
    expect("Zeal from items", sorted(o[1] for o in data["os"] if o[0] == 106)[:1], ["Boneslayer Blade"])
    return bad


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The IAS Calculator page's game numbers.")
    ap.add_argument("game_dir", help="the Diablo II folder (with ProjectD2)")
    ap.add_argument("--check", action="store_true", help="change nothing; exit 1 if the page is out of date")
    ap.add_argument("--selftest", action="store_true", help="check known values, then --check")
    args = ap.parse_args()
    game = pd2_data.Game(args.game_dir)
    data = page_data(game, Archives(args.game_dir))
    if args.selftest:
        bad = selftest(data)
        for b in bad:
            print("selftest:", b)
        print(f"selftest: {'FAILED' if bad else 'ok'}")
        if bad:
            sys.exit(1)
    text = PAGE.read_text(encoding="utf-8")
    old = text[text.index(START):text.index(END)]
    old_v = re.search(r'"v":"([^"]*)"', old)
    if old_v:  # the date changes only with the data
        data["v"] = old_v.group(1)
        if written(text, data) != text:
            data["v"] = datetime.date.today().isoformat()
    new = written(text, data)
    if new == text:
        print("ias_data: the page is up to date")
        return
    if args.check or args.selftest:
        print(f"ias_data: {PAGE.relative_to(ROOT)} is out of date: run python tools/ias_data.py \"<Diablo II folder>\"")
        sys.exit(1)
    PAGE.write_bytes(new.encode("utf-8"))
    print(f"ias_data: wrote {PAGE.relative_to(ROOT)} ({len(new) // 1024} KB)")


if __name__ == "__main__":
    main()
