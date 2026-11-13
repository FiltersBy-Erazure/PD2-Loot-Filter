#!/usr/bin/env python3
"""
The IAS Calculator's attack previews: every attack animation the page can show, drawn from the game's own sprites
(tools/d2_sprites.py), one facing (south-east, the game's three-quarter view), with light armor, the weapon graphic
of every base that uses the animation, a shield, a floor and a monster to hit.

    python tools/ias_sprites.py "C:\\Users\\<you>\\Diablo II"            write website/resources/IAS-Calculator-Sprites/
    python tools/ias_sprites.py "C:\\Users\\<you>\\Diablo II" --stats    count and size them, write nothing
    python tools/ias_sprites.py "C:\\Users\\<you>\\Diablo II" --only BAA11HS

It reads the page's DATA line (written by tools/ias_data.py: the animations, the weapon bases and their graphics) and
the game's d2exp.mpq / d2char.mpq (the characters' animations; PD2's own archives hold none of them), d2data.mpq
(the palette, the floor). Rerun it after a PD2 patch that changes the characters' animations or adds weapon
graphics; not run by build.bat, the edit hook or CI (it needs the game files).

Each animation is two files: <ANIM>.png, an indexed atlas of every layer's frames (body parts, each weapon graphic,
the shield), and <ANIM>.js, which hands the page its layout: window.IAS_SPRITES[anim] = {f: frames, o: the layers'
drawing order per frame, p: {part: [[atlas x, y, width, height, x and y from the feet], ...]}}. A script, so the
page also works opened as a file. Parts: the body part's code (TR...), or code:graphic for a weapon or shield
(RH:CRS).
"""
import argparse
import json
import random
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
import d2_sprites  # noqa: E402
import editor_assets  # noqa: E402  (png_rgba)
import ias_data  # noqa: E402
import pd2_mpq  # noqa: E402

OUT = ROOT / "website" / "resources" / "IAS-Calculator-Sprites"
DIRECTION = 3  # south-east: the same in the 16- and 8-direction animations
BODY = ("HD", "TR", "LG", "RA", "LA", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8")
WEAPON = ("RH", "LH")
SHIELDS = ("KIT", "LRG", "TOW", "BUC", "SPK", "BSH")  # the first one a class has
ATTACK_MODES = ("A1", "A2", "S1", "S2", "S3", "S4", "TH", "KK")
TARGET = ("ZM", ("NU", "GH"), 1)  # a zombie, standing and taking a hit, facing north-west (towards the attacker)
FLOOR = {"floor": ("Act1/Town/Floor.dt1", "ACT1", [(0, 0)]), "light": (0.8, None)}
STAGE = (360, 210)  # the floor picture, in game pixels
ATLAS_W = 1024
BS = chr(92)


class Archives:
    def __init__(self, folder):
        d = Path(folder)
        self.mpqs = [pd2_mpq.MPQ(str(p)) for p in (d / "ProjectD2" / "pd2assets.mpq", d / "ProjectD2" / "pd2data.mpq",
                                                   d / "ProjectD2" / "patch_d2.mpq", d / "d2exp.mpq", d / "d2char.mpq",
                                                   d / "d2data.mpq")]
        self.cache = {}

    def read(self, name):
        name = name.replace("/", BS)
        if name in self.cache:
            if self.cache[name] is None:
                raise KeyError(name)
            return self.cache[name]
        for m in self.mpqs:
            try:
                self.cache[name] = m.read(name)
                return self.cache[name]
            except KeyError:
                pass
        self.cache[name] = None
        raise KeyError(name)

    def has(self, name):
        try:
            self.read(name)
            return True
        except KeyError:
            return False


def page_data():
    text = ias_data.PAGE.read_text(encoding="utf-8")
    i, j = text.index(ias_data.START) + len(ias_data.START), text.index(ias_data.END)
    body = text[i:j].strip()
    return json.loads(body[len("const DATA = "):body.rindex(";")].replace("<\\/", "</"))


def folder(tok):
    return "monsters" if tok in ("40", "TG") else "chars"


def wanted(data):
    """The animations to draw: (token, mode, weapon class) of every attack animation, and of the steps of every
    sequence the page lists."""
    tokens = {t for _, _, t in data["cls"]} | {"40", "TG"}
    out = {k for k in data["a"] if k[:2] in tokens and k[2:4] in ATTACK_MODES}
    by_cls = {c: t for c, _, t in data["cls"]}
    for s in data["sk"]:
        if not s.get("q"):
            continue
        tok = by_cls.get(s["c"])
        for wc, steps in data["sq"].get(str(s["q"]), {}).items():
            for mode in {st[0] for st in steps}:
                for t in ([tok] if tok else []) + [t for t in by_cls.values() if any(o[0] == s["id"] for o in data["os"])]:
                    out.add(t + mode + wc.upper())
    return sorted(k for k in out if len(k) == 7)


def graphics(data, tok, wc):
    """The weapon graphics of the bases a class holds in this animation: {hand: [graphic]}."""
    cls = next((c for c, _, t in data["cls"] if t == tok), None)
    tcls = data["tcls"]
    holds = [b for b in data["b"] if not any(tcls.get(t) and tcls[t] != cls for t in b["ty"])]
    wc = wc.lower()
    one = {"1ss": ("1hs", "1hs"), "1js": ("1hs", "1ht"), "1jt": ("1ht", "1ht"), "1st": ("1ht", "1hs"), "ht2": ("ht1", "ht1")}
    if wc in one:
        first, second = one[wc]
        return {"RH": sorted({b["g"] for b in holds if b["wc"] == first and b["g"]}),
                "LH": sorted({b["g"] for b in holds if b["wc"] == second and b["g"]})}
    gs = sorted({b["g"] for b in holds if b["g"] and (b["wc"] == wc or b["wc2"] == wc)})
    return {"RH": gs, "LH": gs}


def decode_anim(arch, data, key, stats):
    tok, mode, wc = key[:2], key[2:4], key[4:]
    try:
        cof = d2_sprites.cof(arch.read(f"data/global/{folder(tok)}/{tok}/cof/{key}.cof"))
    except KeyError:
        return None
    d = DIRECTION if DIRECTION < cof["directions"] else 0
    gfx = graphics(data, tok, wc)
    parts = {}
    for layer in cof["layers"]:
        comp = layer["comp"]
        lwc = layer["wc"] or wc
        if comp in BODY:
            looks = [("", "LIT")]
        elif comp in WEAPON:
            looks = [(g, g) for g in gfx[comp]]
        elif comp == "SH":
            shield = next((s for s in SHIELDS if arch.has(f"data/global/{folder(tok)}/{tok}/SH/{tok}SH{s}{mode}{lwc}.dcc")), None)
            looks = [(shield, shield)] if shield else []
        else:
            looks = []
        for name, look in looks:
            path = f"data/global/{folder(tok)}/{tok}/{comp}/{tok}{comp}{look}{mode}{lwc}.dcc"
            try:
                frames = d2_sprites.dcc(arch.read(path), d)
            except KeyError:
                stats["missing"] = stats.get("missing", 0) + 1
                continue
            parts[comp + (":" + name if name else "")] = frames
    if not parts:
        return None
    return {"f": cof["frames"], "o": cof["order"][d], "parts": parts, "events": cof["events"]}


def pack(parts):
    """Shelf-packs every frame of every part: (atlas width, height, pixels, {part: [[x, y, w, h, dx, dy]]})."""
    items = [(name, i, fr) for name, frames in parts.items() for i, fr in enumerate(frames) if fr["w"] and fr["h"]]
    items.sort(key=lambda t: -t[2]["h"])
    x = y = shelf = 0
    place = {}
    for name, i, fr in items:
        if x + fr["w"] > ATLAS_W:
            x, y, shelf = 0, y + shelf + 1, 0
        place[(name, i)] = (x, y)
        x += fr["w"] + 1
        shelf = max(shelf, fr["h"])
    w, h = ATLAS_W if y else max(1, x), y + shelf
    px = bytearray(w * h)
    layout = {}
    for name, frames in parts.items():
        rows = []
        for i, fr in enumerate(frames):
            if not (fr["w"] and fr["h"]):
                rows.append(0)
                continue
            ax, ay = place[(name, i)]
            for yy in range(fr["h"]):
                px[(ay + yy) * w + ax:(ay + yy) * w + ax + fr["w"]] = fr["px"][yy * fr["w"]:(yy + 1) * fr["w"]]
            rows.append([ax, ay, fr["w"], fr["h"], fr["x"], fr["y"]])
        layout[name] = rows
    return w, h, px, layout


def png_indexed(path, w, h, px, pal):
    """An 8-bit indexed PNG, index 0 transparent, rows unfiltered (smaller than any filter for these sprites)."""
    import struct
    import zlib

    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body))
    raw = b"".join(b"\x00" + bytes(px[y * w:(y + 1) * w]) for y in range(h))
    plte = b"".join(bytes(rgb) for rgb in pal)
    path.write_bytes(bytes([0x89]) + b"PNG" + bytes([13, 10, 26, 10]) + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 3, 0, 0, 0))
                     + chunk(b"PLTE", plte) + chunk(b"tRNS", b"\x00") + chunk(b"IDAT", zlib.compress(raw, 9))
                     + chunk(b"IEND", b""))


def palette(arch):
    pal = arch.read("data/global/palette/ACT1/pal.dat")
    return [(pal[i * 3 + 2], pal[i * 3 + 1], pal[i * 3]) for i in range(256)]


def write_stage(arch, out):
    """The floor under the preview: the Rogue Encampment's ground at the game's own pixels."""
    import example_shots as X
    w, h = STAGE
    rgb, _ = X.draw_floor(arch, FLOOR, w, h, random.Random(14))
    px = bytearray()
    for i in range(w * h):
        px += bytes((min(255, int(rgb[i * 3])), min(255, int(rgb[i * 3 + 1])), min(255, int(rgb[i * 3 + 2])), 255))
    editor_assets.png_rgba(out / "stage.png", w, h, px)


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="The IAS Calculator's attack previews from the game's sprites.")
    ap.add_argument("game_dir")
    ap.add_argument("--stats", action="store_true", help="count and size them, write nothing")
    ap.add_argument("--only", help="one animation, e.g. BAA11HS")
    args = ap.parse_args()
    arch, data = Archives(args.game_dir), page_data()
    keys = [args.only] if args.only else wanted(data)
    pal = palette(arch)
    stats, total, made = {}, 0, []
    if not args.stats:
        OUT.mkdir(parents=True, exist_ok=True)
    for key in keys:
        anim = decode_anim(arch, data, key, stats)
        if not anim:
            stats["no cof"] = stats.get("no cof", 0) + 1
            continue
        w, h, px, layout = pack(anim["parts"])
        geo = {"f": anim["f"], "o": anim["o"], "p": layout}
        if args.stats:
            import tempfile
            tmp = Path(tempfile.gettempdir()) / "ias-sprite-size.png"
            png_indexed(tmp, w, h, px, pal)
            size = tmp.stat().st_size + len(json.dumps(geo, separators=(",", ":")))
        else:
            png_indexed(OUT / f"{key}.png", w, h, px, pal)
            js = "(window.IAS_SPRITES = window.IAS_SPRITES || {})[" + json.dumps(key) + "] = " + \
                json.dumps(geo, separators=(",", ":")) + ";\n"
            (OUT / f"{key}.js").write_text(js, encoding="utf-8", newline="\n")
            size = (OUT / f"{key}.png").stat().st_size + len(js)
        total += size
        made.append(key)
        print(f"{key}: {len(layout)} parts, {w}x{h}, {size // 1024} KB")
    tok, modes, d = TARGET
    target = {}
    for mode in modes:
        key = f"{tok}{mode}HTH"
        cof = d2_sprites.cof(arch.read(f"data/global/monsters/{tok}/cof/{key}.cof"))
        parts = {}
        for layer in cof["layers"]:
            path = f"data/global/monsters/{tok}/{layer['comp']}/{tok}{layer['comp']}LIT{mode}{layer['wc'] or 'HTH'}.dcc"
            try:
                parts[layer["comp"]] = d2_sprites.dcc(arch.read(path), d if d < cof["directions"] else 0)
            except KeyError:
                pass
        w, h, px, layout = pack(parts)
        target[mode] = {"f": cof["frames"], "o": cof["order"][d if d < cof["directions"] else 0], "p": layout}
        if not args.stats:
            png_indexed(OUT / f"target-{mode}.png", w, h, px, pal)
    if not args.stats:
        (OUT / "target.js").write_text("window.IAS_TARGET = " + json.dumps(target, separators=(",", ":")) + ";\n",
                                       encoding="utf-8", newline="\n")
        write_stage(arch, OUT)
        stale = [p for p in OUT.glob("*.png") if p.stem not in made and not p.stem.startswith(("target", "stage"))] + \
            [p for p in OUT.glob("*.js") if p.stem not in made and p.stem != "target"]
        if not args.only:
            for p in stale:
                p.unlink()
    print(f"{len(made)} animations, {total // 1024} KB; {stats}")


if __name__ == "__main__":
    main()
