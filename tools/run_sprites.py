#!/usr/bin/env python3
"""
The Run Speed page's race (website/resources/Run-Speed.html): each class running and walking, drawn from the game's
own sprites (tools/d2_sprites.py) facing east (screen right), with light armor and a weapon; the Druid's werewolf and
werebear; the overlays of the movement buffs (Burst of Speed, Vigor, Frenzy and Joust, Feral Rage, Hunger); Blaze's
ground fire; and the Rogue Encampment's ground, as a picture that tiles both ways.

    python tools/run_sprites.py "C:\\Users\\<you>\\Diablo II"          write website/resources/Run-Speed-Sprites/
    python tools/run_sprites.py "C:\\Users\\<you>\\Diablo II" --check  exit 1 if they are out of date

It reads the game's archives as tools/ias_sprites.py does (PD2's first, then d2exp / d2char / d2data) and PD2's
Overlay.txt and Missiles.txt (each overlay's file, length, rate and whether it is drawn behind the unit; the fires'
length and loop), so it needs the game files: build.bat, the hook and CI don't run it. Rerun it after a PD2 patch
that changes those animations, overlays or fires.

Files: race.png (an indexed atlas of every frame: each animation's frames put together from its body parts in the
COF's drawing order, each overlay's and fire's frames), race.js (window.FRW_SPRITES: per animation, overlay and fire
its frames as [atlas x, y, width, height, x and y from the feet], plus what the page needs to play them) and
floor.png (the ground). A script, so the page also works opened as a file. race.js keeps a fingerprint of every game
file read and of how they are drawn: --check compares it.
"""
import argparse
import hashlib
import json
import random
import sys
from pathlib import Path

sys.dont_write_bytecode = True
TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
import d2_sprites  # noqa: E402
import example_shots as X  # noqa: E402  (the floor tiles and their light)
import ias_sprites  # noqa: E402  (the archives, the atlas packing, indexed PNGs)
import pd2_data  # noqa: E402

OUT = ROOT / "website" / "resources" / "Run-Speed-Sprites"
VERSION = 1  # of how they are drawn: a change here redraws them all
EAST = 7  # the DCC direction that faces screen right, in the 8- and 16-direction files alike
BODY = ias_sprites.BODY
# what each runner looks like: its token, the weapon class of its walk and run animations and what it holds
# (the graphics of a Long Bow, two Katars, two Crystal Swords, a Gnarled Staff, a Wand, a Long Sword, a Long Staff;
# a shield where the class holds one)
LOOKS = {
    "ama": ("AM", "BOW", {"LH": "LBW"}),
    "ass": ("AI", "HT2", {"RH": "KTR", "LH": "KTR"}),
    "bar": ("BA", "1SS", {"RH": "CRS", "LH": "CRS"}),
    "dru": ("DZ", "STF", {"RH": "CST"}),
    "nec": ("NE", "1HS", {"RH": "WND", "SH": "shield"}),
    "pal": ("PA", "1HS", {"RH": "LSD", "SH": "shield"}),
    "sor": ("SO", "STF", {"RH": "SST"}),
    "wolf": ("40", "HTH", {}),
    "bear": ("TG", "HTH", {}),
}
MODES = ("RN", "WL", "NU")  # running, walking, standing (at the finish)
# the buffs' overlays (Overlay.txt): Burst of Speed (state quickness), Vigor (stamina), Frenzy and Joust (frenzy),
# Feral Rage (feralrage, a size per charge count), Hunger (hunger)
OVERLAYS = ["quickness", "staminafront", "staminaback", "frenzy", "bloodlust_state"] + \
           [f"feralrage{i}{b}" for i in range(1, 6) for b in ("", "back")]
# Blaze's fire (Missiles.txt): the flames of its trail (blaze2trail, SrvMissileA, which the game puts down as you move)
FIRES = ["blaze2dotfiresmall", "blaze2dotfiremedium"]
FLOOR = ("Act1/Town/Floor.dt1", "ACT1", (0, 0), 0.8)  # the Rogue Encampment's ground, as tools/ias_sprites.py's
FLOOR_TILES = (4, 3)  # the picture repeats every 4 tiles across (640 pixels) and 3 rows down (240)


def animdata(arch):
    """AnimData.d2: {animation: (frames, speed)} (speed: 256ths of a frame per game frame)."""
    import struct
    b = arch.read("data/global/AnimData.d2")
    out, off = {}, 0
    for _ in range(256):
        n = struct.unpack_from("<I", b, off)[0]
        off += 4
        for _ in range(n):
            name = b[off:off + 8].split(b"\0")[0].decode("latin-1").upper()
            out[name] = struct.unpack_from("<II", b, off + 8)
            off += 160
    if off != len(b):
        raise SystemExit(f"run_sprites: AnimData.d2 read {off} of {len(b)} bytes: its layout changed")
    return out


def excel(arch, name):
    return pd2_data.read_table(arch.read("data/global/excel/" + name).decode("latin-1"))


def runner_files(arch, kind, mode):
    """The COF of a runner's animation and its parts' DCC files: (key, cof, [(part, path)])."""
    tok, wc, holds = LOOKS[kind]
    key = tok + mode + wc
    folder = ias_sprites.folder(tok)
    cof = d2_sprites.cof(arch.read(f"data/global/{folder}/{tok}/cof/{key}.cof"))
    files = []
    for layer in cof["layers"]:
        comp, lwc = layer["comp"], layer["wc"] or wc
        if comp in BODY:
            look = "LIT"
        elif comp in ("RH", "LH"):
            look = holds.get(comp)
        elif comp == "SH" and holds.get("SH"):
            look = next((s for s in ias_sprites.SHIELDS
                         if arch.has(f"data/global/{folder}/{tok}/SH/{tok}SH{s}{mode}{lwc}.dcc")), None)
        else:
            look = None
        path = f"data/global/{folder}/{tok}/{comp}/{tok}{comp}{look}{mode}{lwc}.dcc" if look else None
        if path and arch.has(path):
            files.append((comp, path))
        elif comp in ("TR", "RH", "LH", "SH") and (comp == "TR" or holds.get(comp)):
            # a special part (S3...) a look doesn't have is left out, as the game draws nothing for it
            raise SystemExit(f"run_sprites: {key} has no {comp} picture ({path}): the game's files changed")
    return key, cof, files


def compose(arch, cof, files):
    """Every frame facing east, its parts drawn in the COF's order: [{x, y, w, h, px}] (x, y from the feet)."""
    d = EAST if EAST < cof["directions"] else 0
    parts = {comp: d2_sprites.dcc(arch.read(path), d) for comp, path in files}
    order = cof["order"][d2_sprites.cof_row(d, cof["directions"])]
    out = []
    for f in range(cof["frames"]):
        frs = [(parts[c][f]) for c in order[f] if c in parts and f < len(parts[c]) and parts[c][f]["w"]]
        if not frs:
            out.append({"x": 0, "y": 0, "w": 0, "h": 0, "px": bytearray()})
            continue
        x0, y0 = min(p["x"] for p in frs), min(p["y"] for p in frs)
        x1, y1 = max(p["x"] + p["w"] for p in frs), max(p["y"] + p["h"] for p in frs)
        w, h = x1 - x0, y1 - y0
        px = bytearray(w * h)
        for p in frs:  # later parts over earlier ones
            for yy in range(p["h"]):
                row = (p["y"] - y0 + yy) * w + p["x"] - x0
                src = p["px"][yy * p["w"]:(yy + 1) * p["w"]]
                for xx, c in enumerate(src):
                    if c:
                        px[row + xx] = c
        out.append({"x": x0, "y": y0, "w": w, "h": h, "px": px})
    return out


def num(v, default=0):
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def write_floor(arch, path):
    """The ground: the floor tiles of the Rogue Encampment, picked at random but the same every FLOOR_TILES tiles, so
    the picture tiles both ways. Indexed (the act's palette, lit as tools/ias_sprites.py lights it)."""
    dt1, act, style, gamma = FLOOR
    pal = [tuple(min(255, int(c)) for c in rgb) for rgb in X.lit_palette(arch, act, gamma)]
    pool = X.dt1_floors(arch.read("data/global/tiles/" + dt1))[style]
    weights = [max(r, 0) for r, _ in pool]
    weights = weights if sum(weights) else [1] * len(pool)
    nu, nv = 2 * FLOOR_TILES[0], 2 * FLOOR_TILES[1]
    w, h = 80 * nu, 40 * nv
    px = bytearray(w * h)
    rng = random.Random(14)
    # cell (u, v) = (cx - cy, cx + cy) has its top corner at (u * 80, v * 40); u and v are both even or both odd
    for v in range(nv):
        for u in range(v % 2, nu, 2):
            pixels = rng.choices(pool, weights)[0][1]
            for (x, y), c in pixels.items():
                if c:
                    px[((v * 40 + y) % h) * w + (u * 80 + x - 80) % w] = c
    ias_sprites.png_indexed(path, w, h, px, pal)
    return w, h


def draw(game_dir, check=False):
    arch = ias_sprites.Archives(game_dir)
    overlays = {r["overlay"]: r for r in excel(arch, "Overlay.txt") if r.get("overlay")}
    missiles = {r["Missile"]: r for r in excel(arch, "Missiles.txt") if r.get("Missile")}
    anims = animdata(arch)
    frames, info = {}, {"anims": {}, "overlays": {}, "fires": {}}
    for kind in LOOKS:
        for mode in MODES:
            key, cof, files = runner_files(arch, kind, mode)
            frames[key] = compose(arch, cof, files)
            if key not in anims or anims[key][0] != cof["frames"]:
                raise SystemExit(f"run_sprites: AnimData.d2 has no {key} of {cof['frames']} frames")
            # speed: AnimData's (a wereform's walk and run play at it; a character's walk and run at the game's own 213
            # and 101, which the page holds)
            info["anims"][f"{kind}.{mode}"] = {"key": key, "f": cof["frames"], "speed": anims[key][1]}
    for name in OVERLAYS:
        r = overlays.get(name)
        if not r:
            raise SystemExit(f"run_sprites: Overlay.txt has no {name}")
        raw = arch.read("data/global/overlays/" + r["Filename"].replace("\\", "/") + ".dcc")
        frames["ov:" + name] = d2_sprites.dcc(raw, 0)
        # n: the frames it plays (Overlay.txt's, which can be fewer than the file has); pre: drawn before (behind) the
        # unit; rate: sixteenths of a frame per game frame
        info["overlays"][name] = {"f": len(frames["ov:" + name]), "n": min(num(r["Frames"]) or 999, len(frames["ov:" + name])),
                                  "pre": num(r["PreDraw"]), "rate": num(r["AnimRate"], 16),
                                  "dx": num(r["Xoffset"]), "dy": num(r["Yoffset"]), "trans": num(r["Trans"])}
    for name in FIRES:
        r = missiles.get(name)
        if not r:
            raise SystemExit(f"run_sprites: Missiles.txt has no {name}")
        raw = arch.read("data/global/missiles/" + r["CelFile"] + ".dcc")
        frames["fx:" + name] = d2_sprites.dcc(raw, 0)
        info["fires"][name] = {"f": len(frames["fx:" + name]), "len": num(r["AnimLen"]), "loop": num(r["SubLoop"]),
                               "start": num(r["SubStart"]), "stop": num(r["SubStop"]), "range": num(r["Range"]),
                               "rate": num(r["animrate"], 1024)}
    # the trail's own missile: how long its flames burn and how far they spread (client side: what you see)
    r = missiles["blaze2trail"]
    info["fires"]["blaze2trail"] = {"burn": num(r["CHitCalc1"]), "radius": num(r["cHitPar1"]), "density": num(r["cHitPar2"])}
    arch.read("data/global/tiles/" + FLOOR[0])  # the floor's files, in the fingerprint too
    ias_sprites.palette(arch)
    digest = hashlib.sha1(f"{VERSION}|{json.dumps(LOOKS, sort_keys=True)}|{OVERLAYS}|{FIRES}|{FLOOR}|{FLOOR_TILES}|"
                          f"{ias_sprites.ATLAS_W}|{arch.digest()}".encode()).hexdigest()
    js_path = OUT / "race.js"
    if check:
        text = js_path.read_text(encoding="utf-8") if js_path.exists() else ""
        ok = f'"src":"{digest}"' in text and (OUT / "race.png").exists() and (OUT / "floor.png").exists()
        print("run_sprites: up to date" if ok else "run_sprites: out of date: run python tools/run_sprites.py \"<Diablo II folder>\"")
        return 0 if ok else 1
    w, h, px, layout = ias_sprites.pack(frames)
    OUT.mkdir(parents=True, exist_ok=True)
    ias_sprites.png_indexed(OUT / "race.png", w, h, px, ias_sprites.palette(arch))
    info["p"] = layout
    info["floor"] = write_floor(arch, OUT / "floor.png")
    info["src"] = digest
    js_path.write_text("window.FRW_SPRITES = " + json.dumps(info, separators=(",", ":")) + ";\n",
                       encoding="utf-8", newline="\n")
    size = sum(p.stat().st_size for p in OUT.iterdir())
    print(f"run_sprites: {len(frames)} animations, overlays and fires in a {w} x {h} atlas; {size // 1024} KB in "
          f"{OUT.relative_to(ROOT)}")
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("game_dir", help="the Diablo II folder (with ProjectD2 in it)")
    ap.add_argument("--check", action="store_true", help="exit 1 if the pictures are out of date")
    a = ap.parse_args()
    sys.exit(draw(a.game_dir, check=a.check))


if __name__ == "__main__":
    main()
