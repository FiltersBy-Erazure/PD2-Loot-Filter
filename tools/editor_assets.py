#!/usr/bin/env python3
"""The Filter Editor's game art (Erazure-Filter-Editor-Assets/ in the repo root, committed, and its index
tools/editor_assets.json, which tools/editor_map.py puts into the page): written from the game folder, as
tools/grail_map.py and tools/example_shots.py read it, so neither the build nor CI needs the game.

    python tools/editor_map.py --assets "<Diablo II folder>"     (or this file with the folder)

- fonts: D2GL's MTSDF glyph atlases (d2gl.mpq's data/assets/atlases: ExocetBlizzard for labels and hover boxes,
  Formal436BT for the chat, NotoSymbol for what those lack), cut down to the letters the page draws (Latin-1, general
  punctuation, every letter the filter and its styles use, the symbols players pick from) and packed into one sheet
  per atlas; with the font lines of atlases/default.txt the page draws them as D2GL's shader does (EZ.glyphs).
- floors: the floor tiles of a few areas (a DT1's floor tiles, in its act's palette at the area's brightness), one
  strip per area; the page lays them out in the game's diamond grid, each tile picked by its rarity, and lights a
  dungeon as tools/example_shots.py does.
- ground pictures: every item's picture on the ground (the last frame of its flippy DC6, Weapons / Armor / Misc.txt),
  one sheet.
- sounds: every sound the filter and its styles play, and the PoE versions' tinks (Sounds.txt's file, out of
  ProjectD2's MPQs, d2sfx.mpq, d2speech.mpq or d2xtalk.mpq: tools/mpq_audio.py decodes the game's own compression),
  as 4-bit IMA ADPCM (sounds/<id>.adpcm: its sample rate, length, first sample and step index, then two samples a
  byte); the page decodes one when it's played (EZ.sound).
- skill tabs: each class skill's tab (SkillDesc's SkillPage: the class's first tab is its TABSK class x 8), so the rule
  builder can add a skill's tab to a +N to the skill total.

Standard library only. Rerun it after a PD2 patch that changes the fonts, the floors, the items' pictures or the
sounds, and after a filter change that plays a sound it didn't before (the page then offers ".playsound <id>").
"""
import json
import re
import struct
import sys
import zlib
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import example_shots as X  # noqa: E402  (the game's files, PNG reading)

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "Erazure-Filter-Editor-Assets"
INFO = ROOT / "tools" / "editor_assets.json"
# D2GL's fonts the page draws with (atlases/default.txt): labels on the ground, hover boxes (tall ones: 15), chat
FONTS = {"label": 16, "hover": 14, "hoverSmall": 15, "chat": 13}
ATLASES = {"ExocetBlizzard": "font-exocet.png", "Formal436BT": "font-formal.png", "NotoSymbol": "font-symbol.png"}
# the letters the page needs: Latin, its extensions, general punctuation; symbols from NotoSymbol where the font
# lacks them (arrows, shapes, dingbats: the symbols a player may type into a look)
TEXT_RANGES = [(0x20, 0x7E), (0xA0, 0xFF), (0x2010, 0x2027), (0x2030, 0x203A), (0x20AC, 0x20AC)]
SYMBOLS = "•·★☆●○◆◇■□▲△▼▽►◄♦♥♠♣✦✧✪✿❖✚✖✔♪♫☼☀☾♛♚⚔⚡❄☠←→↑↓↔"  # what a player may want in a look
MISSING = 0x2639  # ☹: what D2GL draws for a letter no atlas has


def needed_text():
    """The letters the filter and its styles hold beyond the ranges (they must draw)."""
    out = set()
    for f in sorted((ROOT / "sections").glob("*.filter")) + sorted((ROOT / "styles").glob("*")):
        out |= {ord(ch) for ch in f.read_text(encoding="utf-8") if ord(ch) > 0x7e}
    return out


def png_rgba(path, w, h, px):
    """An RGBA PNG, each row with the filter that packs it best (sum of absolute differences)."""
    stride, rows, prev = w * 4, [], bytes(w * 4)
    for y in range(h):
        line = px[y * stride:(y + 1) * stride]
        cands = [b"\x00" + bytes(line),
                 b"\x01" + bytes((line[x] - (line[x - 4] if x >= 4 else 0)) & 255 for x in range(stride)),
                 b"\x02" + bytes((line[x] - prev[x]) & 255 for x in range(stride))]
        rows.append(min(cands, key=lambda c: sum(v if v < 128 else 256 - v for v in c[1:])))
        prev = line

    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body))
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
                     + chunk(b"IDAT", zlib.compress(b"".join(rows), 9)) + chunk(b"IEND", b""))


class Atlas:
    """One of D2GL's atlases: {code point: (advance, plane l b r t, atlas l b r t)} and its RGBA pixels."""

    def __init__(self, game, name):
        base = f"data/assets/atlases/{name}/"
        self.glyphs = {}
        for line in game.d2gl.read(base + "data.csv").decode().splitlines():
            if line.strip():
                page, cp, *nums = line.split(",")
                nums = [float(x) for x in nums]
                self.glyphs[int(cp)] = (nums[0], nums[1:5], nums[5:9])
        self.w, self.h, bpp, self.px = X.png_read(game.d2gl.read(base + "0.png"))
        if bpp != 4:
            raise SystemExit(f"{name}: an atlas without alpha")


def pack(atlas, cps, width=512):
    """The glyphs cut out (with a pixel round each for the shader's bilinear reads) and packed on shelves:
    (sheet width, height, pixels, {code point: [advance, pl, pb, pr, pt, left, top, right, bottom]}) with the atlas
    box in the sheet's pixels from its top left."""
    boxes = []
    for cp in sorted(cps):
        adv, plane, (al, ab, ar, at) = atlas.glyphs[cp]
        if ar <= al or at <= ab:
            boxes.append((cp, adv, plane, None))
            continue
        sx, sy = max(int(al) - 1, 0), max(int(atlas.h - at) - 1, 0)
        ex, ey = min(int(ar) + 2, atlas.w), min(int(atlas.h - ab) + 2, atlas.h)
        boxes.append((cp, adv, plane, (sx, sy, ex - sx, ey - sy, al, ab, ar, at)))
    order = sorted((b for b in boxes if b[3]), key=lambda b: -b[3][3])
    x = y = shelf = 0
    place = {}
    for cp, _, _, (sx, sy, sw, sh, *_rest) in order:
        if x + sw > width:
            x, y, shelf = 0, y + shelf, 0
        place[cp] = (x, y)
        x += sw
        shelf = max(shelf, sh)
    height = y + shelf
    px = bytearray(width * height * 4)
    out = {}
    for cp, adv, plane, box in boxes:
        if not box:
            out[cp] = [round(adv, 5)] + [round(v, 5) for v in plane] + [0, 0, 0, 0]
            continue
        sx, sy, sw, sh, al, ab, ar, at = box
        dx, dy = place[cp]
        for r in range(sh):
            src = ((sy + r) * atlas.w + sx) * 4
            dst = ((dy + r) * width + dx) * 4
            px[dst:dst + sw * 4] = atlas.px[src:src + sw * 4]
        left, top = dx + (al - sx), dy + ((atlas.h - at) - sy)
        out[cp] = ([round(adv, 5)] + [round(v, 5) for v in plane] +
                   [round(left, 4), round(top, 4), round(left + (ar - al), 4), round(top + (at - ab), 4)])
    return width, height, px, out


def runs(cps):
    """Every code point an atlas has, as [first, last] runs (lint: a letter no font of the game has draws ☹; the
    sheets hold only the letters the page needs)."""
    out = []
    for cp in sorted(cps):
        if out and out[-1][1] == cp - 1:
            out[-1][1] = cp
        else:
            out.append([cp, cp])
    return out


def fonts(game, info):
    rows = {}
    for line in game.d2gl.read("data/assets/atlases/default.txt").decode().splitlines():
        cols = [c.strip() for c in line.split("|")]
        if cols and cols[0].isdigit():
            rows[int(cols[0])] = cols
    info["fonts"] = {}
    for use, fid in FONTS.items():
        c = rows[fid]
        info["fonts"][use] = {"id": fid, "atlas": c[1], "size": float(c[2]), "weight": float(c[3]),
                              "spacing": float(c[4]), "lineHeight": float(c[5]), "shadow": float(c[6]),
                              "offX": float(c[7]), "offY": float(c[8]), "symbolOff": float(c[9])}
    text = {cp for a, b in TEXT_RANGES for cp in range(a, b + 1)} | needed_text()
    atlases = {name: Atlas(game, name) for name in ATLASES}
    main = [n for n in atlases if n != "NotoSymbol"]
    symbols = {MISSING}
    for cp in text | {ord(ch) for ch in SYMBOLS}:
        if not any(cp in atlases[n].glyphs for n in main):
            symbols.add(cp)
    info["atlases"] = {}
    OUT.mkdir(exist_ok=True)
    for name, file in ATLASES.items():
        a = atlases[name]
        cps = {cp for cp in (symbols if name == "NotoSymbol" else text) if cp in a.glyphs}
        w, h, px, glyphs = pack(a, cps)
        png_rgba(OUT / file, w, h, px)
        info["atlases"][name] = {"file": file, "w": w, "h": h, "em": 32,
                                 "glyphs": {str(cp): g for cp, g in sorted(glyphs.items())},
                                 "has": runs(a.glyphs)}
        print(f"{file}: {len(glyphs)} glyphs, {w}x{h}, {(OUT / file).stat().st_size // 1024} KB")


# the scenes' floors: (DT1, act, the (main, sub) tile groups, the brightness (gamma), a dungeon's light radius)
FLOORS = {"baal": ("Expansion/BaalLair/floor.dt1", "ACT5", [(0, 0)], 1.0, 560),
          "chaos": ("Act4/Diab/Floor.dt1", "ACT4", [(40, 0)], 0.75, 560),
          "barracks": ("Act1/Barracks/floor.dt1", "ACT1", [(0, 0)], 0.75, 330),
          "rogue": ("Act1/Town/Floor.dt1", "ACT1", [(0, 0)], 0.75, None),
          "lut": ("Act2/Town/Ground.dt1", "ACT2", [(0, 0)], 0.85, None),
          "harrogath": ("Expansion/Town/ground.dt1", "ACT5", [(0, 0), (0, 1)], 0.75, None)}


def png_indexed(path, w, h, px, palette, transparent=0):
    """An 8-bit indexed PNG: palette [(r, g, b)] x 256, one index transparent."""
    raw = b"".join(b"\x01" + bytes((px[y * w + x] - (px[y * w + x - 1] if x else 0)) & 255 for x in range(w))
                   for y in range(h))

    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body))
    plte = b"".join(bytes(min(max(int(c + 0.5), 0), 255) for c in rgb) for rgb in palette)
    trns = bytes(0 if i == transparent else 255 for i in range(transparent + 1))
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 3, 0, 0, 0))
                     + chunk(b"PLTE", plte) + chunk(b"tRNS", trns) + chunk(b"IDAT", zlib.compress(raw, 9))
                     + chunk(b"IEND", b""))


def floors(game, info):
    info["floors"] = {}
    for name, (path, act, groups, gamma, radius) in FLOORS.items():
        tiles = X.dt1_floors(game.read("data/global/tiles/" + path))
        pool = [t for key in groups for t in tiles.get(key, [])]
        pal = X.lit_palette(game, act, gamma)
        w = 160 * len(pool)
        px = bytearray(w * 80)
        for n, (_, pixels) in enumerate(pool):
            for (x, y), c in pixels.items():
                if 0 <= x < 160 and 0 <= y < 80:
                    px[y * w + n * 160 + x] = c
        file = f"floor-{name}.png"
        png_indexed(OUT / file, w, 80, px, pal)
        info["floors"][name] = {"file": file, "rarity": [max(r, 0) for r, _ in pool], "light": radius}
        print(f"{file}: {len(pool)} tiles, {(OUT / file).stat().st_size // 1024} KB")


def flippies(game):
    """{code: flippy file} of Weapons, Armor and Misc.txt."""
    out = {}
    for table in ("Weapons", "Armor", "Misc"):
        rows = game.read(f"data/global/excel/{table}.txt").decode("latin-1").splitlines()
        head = rows[0].split("\t")
        ci, fi = head.index("code"), head.index("flippyfile")
        for r in rows[1:]:
            c = r.split("\t")
            if len(c) > fi and c[ci] and c[fi]:
                out[c[ci]] = c[fi]
    return out


def ground(game, info):
    """One sheet of every item's picture on the ground, in act 1's palette."""
    files = flippies(game)
    frames = {}
    for f in sorted(set(files.values())):
        try:
            frames[f] = X.dc6_last_frame(game.read(f"data/global/items/{f}.dc6"))
        except KeyError:
            continue
    order = sorted(frames, key=lambda f: -frames[f][1])
    width, x, y, shelf, place = 1024, 0, 0, 0, {}
    for f in order:
        w, h, _ = frames[f]
        if x + w + 1 > width:
            x, y, shelf = 0, y + shelf + 1, 0
        place[f] = (x, y)
        x += w + 1
        shelf = max(shelf, h)
    height = y + shelf
    px = bytearray(width * height)
    for f, (dx, dy) in place.items():
        _, _, pixels = frames[f]
        for (sx, sy), c in pixels.items():
            px[(dy + sy) * width + dx + sx] = c
    pal = X.lit_palette(game, "ACT1", 1.0)
    png_indexed(OUT / "ground.png", width, height, px, pal)
    info["ground"] = {"file": "ground.png", "sprites": {f: [x, y, frames[f][0], frames[f][1]] for f, (x, y) in place.items()},
                      "items": {c: f for c, f in sorted(files.items()) if f in place}}
    print(f"ground.png: {len(place)} pictures, {width}x{height}, {(OUT / 'ground.png').stat().st_size // 1024} KB")


# IMA ADPCM's tables (the standard: 89 step sizes, the step index's change per code)
IMA_STEPS = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88,
             97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658,
             724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660,
             4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818,
             18500, 20350, 22385, 24623, 27086, 29794, 32767]
IMA_INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8]


def ima_encode(pcm):
    """16-bit samples -> (first sample, first step index, the codes, two a byte, low nibble first); the decoder's own
    prediction is tracked, so the error doesn't build up."""
    d0 = abs(pcm[1] - pcm[0]) if len(pcm) > 1 else 0  # the first step near the first change: no slow start
    pred, index, codes = pcm[0] if pcm else 0, min(range(89), key=lambda i: abs(IMA_STEPS[i] - d0)), []
    start = index
    for x in pcm[1:]:
        step = IMA_STEPS[index]
        diff, code = x - pred, 0
        if diff < 0:
            code, diff = 8, -diff
        delta = step >> 3
        if diff >= step:
            code |= 4; diff -= step; delta += step
        step >>= 1
        if diff >= step:
            code |= 2; diff -= step; delta += step
        step >>= 1
        if diff >= step:
            code |= 1; delta += step
        pred = max(-32768, min(32767, pred - delta if code & 8 else pred + delta))
        index = max(0, min(88, index + IMA_INDEX[code]))
        codes.append(code)
    if len(codes) % 2:
        codes.append(0)
    return (pcm[0] if pcm else 0), start, bytes(codes[i] | (codes[i + 1] << 4) for i in range(0, len(codes), 2))


def wav_pcm(data):
    """(rate, channels, 16-bit samples, the first channel) of a PCM WAV."""
    pos, fmt, pcm = 12, None, None
    while pos + 8 <= len(data):
        cid, n = data[pos:pos + 4], struct.unpack_from("<I", data, pos + 4)[0]
        if cid == b"fmt ":
            tag, ch, rate = struct.unpack_from("<HHI", data, pos + 8)
            bits = struct.unpack_from("<H", data, pos + 22)[0]
            fmt = (tag, ch, rate, bits)
        elif cid == b"data":
            pcm = data[pos + 8:pos + 8 + n]
        pos += 8 + n + (n & 1)
    if not fmt or pcm is None or fmt[0] != 1 or fmt[3] not in (8, 16):
        raise ValueError(f"not a PCM WAV: {fmt}")
    tag, ch, rate, bits = fmt
    if bits == 8:
        samples = [(b - 128) << 8 for b in pcm]
    else:
        samples = list(struct.unpack(f"<{len(pcm) // 2}h", pcm[:len(pcm) // 2 * 2]))
    return rate, samples[::ch]


def sounds(folder, game, info):
    import pd2_mpq
    import tier_map as T
    d = Path(folder)
    archives = [d / "ProjectD2" / n for n in ("pd2assets.mpq", "pd2data.mpq", "patch_d2.mpq")]
    archives += [d / n for n in ("d2exp.mpq", "d2sfx.mpq", "d2speech.mpq", "d2xtalk.mpq", "d2data.mpq")]
    mpqs = [pd2_mpq.MPQ(str(a)) for a in archives if a.exists()]
    ids = set(range(4714, 4730))
    for f in sorted((ROOT / "sections").glob("*.filter")) + sorted((ROOT / "styles").glob("*")):
        ids |= {int(x) for x in re.findall(r"%SOUNDID-(\d{1,4})%", f.read_text(encoding="utf-8"), re.I)}
    table = T.load_sounds()
    (OUT / "sounds").mkdir(exist_ok=True)
    info["sounds"], total = {}, 0
    for sid in sorted(ids):
        s = table.get(sid)
        if not s or not s["file"]:
            continue
        data = None
        for path in ("data\\global\\sfx\\" + s["file"], "data\\local\\sfx\\" + s["file"]):  # speech: data\local
            for m in mpqs:
                try:
                    data = m.read(path)
                    break
                except KeyError:
                    continue
            if data is not None:
                break
        if data is None:
            print(f"sound {sid}: no {path}")
            continue
        rate, pcm = wav_pcm(data)
        first, index, codes = ima_encode(pcm)
        file = f"sounds/{sid}.adpcm"
        (OUT / file).write_bytes(struct.pack("<IIhH", rate, len(pcm), first, index) + codes)
        info["sounds"][str(sid)] = {"file": file, "rate": rate, "n": len(pcm)}
        total += (OUT / file).stat().st_size
    print(f"sounds/: {len(info['sounds'])} sounds, {total // 1024} KB")


CLASSES = {"ama": 0, "sor": 1, "nec": 2, "pal": 3, "bar": 4, "dru": 5, "ass": 6}


def skill_tabs(folder, info):
    """{skill id: its TABSK number}: the class's number x 8 + its SkillDesc page - 1 (Sorceress fire 8, lightning 9,
    cold 10)."""
    import pd2_data
    import pd2_mpq
    pd2 = pd2_mpq.MPQ(Path(folder) / "ProjectD2" / "pd2data.mpq")
    excel = lambda name: pd2_data.read_table(  # noqa: E731
        pd2.read(chr(92).join(["data", "global", "excel", name])).decode("latin-1"))
    pages = {r["skilldesc"]: r.get("SkillPage", "") for r in excel("SkillDesc.txt") if r.get("skilldesc")}
    tabs = {}
    for r in excel("Skills.txt"):
        cls, page = CLASSES.get(r.get("charclass", "").strip()), pages.get(r.get("skilldesc", ""), "")
        if r["Id"].strip().isdigit() and cls is not None and page.strip().isdigit() and 1 <= int(page) <= 3:
            tabs.setdefault(r["Id"].strip(), cls * 8 + int(page) - 1)
    info["skillTabs"] = tabs
    print(f"skill tabs: {len(tabs)} class skills")


def write(folder):
    game = X.Game(folder)
    info = {"v": 1}
    fonts(game, info)
    floors(game, info)
    ground(game, info)
    sounds(folder, game, info)
    skill_tabs(folder, info)
    INFO.write_text(json.dumps(info, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {INFO.relative_to(ROOT)} ({INFO.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    write(sys.argv[1])
