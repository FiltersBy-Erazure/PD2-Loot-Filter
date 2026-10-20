#!/usr/bin/env python3
"""
The website's Examples pictures (website/docs/img/examples/<scene>.png, committed): items on the ground with the
labels the filter gives them, drawn the way the game draws them. Run it after a look changes.

A picture is a scene of SCENES: a floor of the game's own tiles (a DT1 file in its act's palette, lit like the
area), each item's picture on the ground (the last frame of its flippy DC6, Misc.txt) and over each item its label.
The label is the filter's: every rule is run for the item as tools/explain_item.py runs it (Erazure - Main; the
scene gives the filter level, character level, area and so on, and a rule that tests a value the scene leaves out
stops the run), each %NAME% filled with the name so far. It is drawn as PD2's HD text (D2GL,
github.com/bayaraa/d2gl, modules/hd_text) draws a dropped item's name: font 16 of d2gl.mpq's atlases/default.txt
(ExocetBlizzard, 14.5 px), each glyph out of its MSDF atlas (one the font lacks, such as "•", out of NotoSymbol's)
after its shadow, on a 60% black box that fades out at both ends. BH's color words are the game's color codes
(BH ItemDisplay.cpp; in Glide mode, as PD2 runs, BLACK, CORAL, SAGE, TEAL and LIGHT_GRAY are the low codes), in
D2GL's colors (g_text_colors). The game runs at its own resolution and the window scales it up: SCALE output pixels
per game pixel.

Standard library only. Needs the game folder (d2data.mpq, d2exp.mpq, ProjectD2's MPQs and d2gl.mpq):
    python tools/example_shots.py "C:/Users/<you>/Diablo II"                  every picture
    python tools/example_shots.py "<Diablo II folder>" --only runes-high      one
"""
import argparse
import random
import re
import struct
import sys
import zlib
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402
import explain_item as E  # noqa: E402
import lint_filter as L  # noqa: E402
import pd2_mpq  # noqa: E402

ROOT = build.ROOT
OUT = ROOT / "website" / "docs" / "img" / "examples"
BASES = ROOT / "docs" / "pd2-bases.tsv"
SCALE = 2  # output pixels per game pixel
LABEL_FONT = 16  # D2GL's font for dropped items' labels
GAMMA = 0.75  # the floor's brightness in town, against the palette (measured on an in-game screenshot of grass)

# BH's color words: the game's color codes (in Glide mode the low ones), as D2GL draws them (RRGGBB)
COLORS = {"WHITE": "FEFEFE", "RED": "FE6950", "GREEN": "25FE00", "BLUE": "7B7BFE", "GOLD": "DFB679",
          "GRAY": "7B7B7B", "BLACK": "000000", "TAN": "D9CD8E", "ORANGE": "FFB200", "YELLOW": "EBEB75",
          "PURPLE": "B700FF", "DARK_GREEN": "008C00", "CORAL": "E09595", "SAGE": "B6E12E", "TEAL": "5CA6A4",
          "LIGHT_GRAY": "A9A9B0"}
GAME_CODES = {"0": "WHITE", "1": "RED", "2": "GREEN", "3": "BLUE", "4": "GOLD", "5": "GRAY", "6": "BLACK",
              "7": "TAN", "8": "ORANGE", "9": "YELLOW", ";": "PURPLE", ":": "DARK_GREEN"}  # ÿc in item names
COLOR_RE = re.compile(r"%(" + "|".join(COLORS) + r")%")
BOX_RGBA = (0, 0, 0, 0x99 / 255)  # D2GL m_alt_bg_color

# Each scene: its floor (a DT1 of the area, its act's palette, the (main, sub) tile groups it is filled with), its
# light (gamma; a dungeon's light radius in game pixels), the values every rule reads (the scene's area, filter
# level...) and its items in columns (code, or code and values of its own).
SCENES = [
    {"name": "potions",
     "floor": ("Act1/Town/Floor.dt1", "ACT1", [(0, 0)]), "light": (GAMMA, None),
     "values": {"FILTLVL": 1, "CLVL": 5, "MAPID": 1, "DIFF": 0, "QTY": 1},
     "columns": [["hp1", "hp2", "hp3", "hp4", "hp5"], ["mp1", "mp2", "mp3", "mp4", "mp5"],
                 ["rvs", "rvl", "vps", "yps", "wms"], ["isc", "ibk", "tsc", "tbk"]]},
    {"name": "gems",
     "floor": ("Act1/Barracks/floor.dt1", "ACT1", [(0, 0)]), "light": (GAMMA, 330),
     "values": {"FILTLVL": 1, "CLVL": 90, "MAPID": 29, "DIFF": 2, "QTY": 1, "GEMLEVEL": 5},
     "columns": [[("gpv", {"GEMTYPE": 1}), ("gpb", {"GEMTYPE": 5}), ("gpg", {"GEMTYPE": 3}), ("gpy", {"GEMTYPE": 6})],
                 [("gpr", {"GEMTYPE": 4}), ("gpw", {"GEMTYPE": 2}), ("skz", {"GEMTYPE": 7})]]},
    {"name": "runes-low",
     "floor": ("Act2/Town/Ground.dt1", "ACT2", [(0, 0)]), "light": (0.85, None),
     "values": {"FILTLVL": 1, "CLVL": 90, "MAPID": 40, "DIFF": 2, "QTY": 1},
     "columns": [["r01", "r02", "r03", "r04", "r05", "r06", "r07"], ["r08", "r09", "r10", "r11", "r12"],
                 ["r13", "r14", "r15", "r16"]]},
    {"name": "runes-mid",
     "floor": ("Expansion/Town/ground.dt1", "ACT5", [(0, 0), (0, 1)]), "light": (GAMMA, None),
     "values": {"FILTLVL": 1, "CLVL": 90, "MAPID": 109, "DIFF": 2, "QTY": 1},
     "columns": [["r17", "r18", "r19", "r20", "r21"], ["r22", "r23", "r24", "r25"]]},
    {"name": "runes-high",
     "floor": ("Expansion/BaalLair/floor.dt1", "ACT5", [(0, 0)]), "light": (1.0, 560),
     "values": {"FILTLVL": 1, "CLVL": 90, "MAPID": 128, "DIFF": 2, "QTY": 1},
     "columns": [["r26", "r27", "r28", "r29"], ["r30", "r31", "r32", "r33"]]},
    {"name": "dclone-rathma-lucion",
     "floor": ("Act4/Diab/Floor.dt1", "ACT4", [(40, 0)]), "light": (GAMMA, 560),
     "values": {"FILTLVL": 1, "CLVL": 90, "MAPID": 108, "DIFF": 2, "QTY": 1, "STAT185": 0},
     "columns": [["dcma", "dcso", "dcbl", "dcho"], ["rtma", "rtmv", "rtmo", "cm2f"], ["luca", "lucb", "lucc", "lucd"]]},
]
ROW = 46  # game pixels from one label to the next in a column
GAP = 44  # between the widest labels of two columns
MARGIN = (40, 34)  # around the labels and items (x, y)


# ---------------------------------------------------------------- files

class Game:
    """The game's files: ProjectD2's MPQs before the base game's, as the game reads them."""

    def __init__(self, folder):
        d = Path(folder)
        names = [d / "ProjectD2" / n for n in ("pd2assets.mpq", "pd2data.mpq", "patch_d2.mpq")]
        names += [d / "d2exp.mpq", d / "d2data.mpq"]
        missing = [str(n) for n in names + [d / "ProjectD2" / "d2gl.mpq"] if not n.exists()]
        if missing:
            sys.exit("not in the game folder: " + ", ".join(missing))
        self.mpqs = [pd2_mpq.MPQ(str(n)) for n in names]
        self.d2gl = pd2_mpq.MPQ(str(d / "ProjectD2" / "d2gl.mpq"))

    def read(self, name):
        for m in self.mpqs:
            try:
                return m.read(name)
            except KeyError:
                pass
        raise KeyError(name)


def png_read(data):
    """(width, height, bytes per pixel, pixels) of an 8-bit RGB or RGBA PNG."""
    pos, idat = 8, []
    while pos < len(data):
        n, kind = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + n]
        if kind == b"IHDR":
            w, h, depth, ctype = struct.unpack(">IIBB", body[:10])
            if depth != 8 or ctype not in (2, 6):
                raise ValueError(f"PNG of depth {depth}, color type {ctype}")
            bpp = 4 if ctype == 6 else 3
        elif kind == b"IDAT":
            idat.append(body)
        pos += 12 + n
    raw = zlib.decompress(b"".join(idat))
    stride = w * bpp
    out, prev, i = bytearray(h * stride), bytearray(stride), 0
    for y in range(h):
        f, line = raw[i], bytearray(raw[i + 1:i + 1 + stride])
        i += 1 + stride
        if f == 1:
            for x in range(bpp, stride):
                line[x] = (line[x] + line[x - bpp]) & 255
        elif f == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                line[x] = (line[x] + (((line[x - bpp] if x >= bpp else 0) + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a, b = (line[x - bpp] if x >= bpp else 0), prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, bpp, out


def png_write(path, w, h, rgb):
    raw = b"".join(b"\x00" + bytes(rgb[y * w * 3:(y + 1) * w * 3]) for y in range(h))

    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body))
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
                     + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


# ---------------------------------------------------------------- the labels

def load_rules():
    lines, where = E.load(build.MAIN)
    lt = L.Linter(lines, where, False)
    rules = []
    for r in lt.rules:
        name, cont, *_ = E.action(r.output, lt.aliases)
        rules.append((where(r.idx), E.expand_condition(r.cond, lt.aliases), name, cont))
    return rules


def load_names():
    names = {}
    for line in BASES.read_text(encoding="utf-8").splitlines():
        if line and not line.startswith("#"):
            code, name = line.split("\t")[:2]
            names[code] = re.sub("ÿc(.)", lambda m: f"%{GAME_CODES.get(m.group(1), 'WHITE')}%", name)
    return names


class Item:
    """An item on the ground as explain_item reads one: identified, not ethereal, the values given."""

    def __init__(self, code, values):
        self.code, self.quality, self.groups, self.cls, self.where = code, "NMAG", set(), None, "GROUND"
        self.values = {"ID": 1, "ETH": 0, **values}
        rune = re.fullmatch(r"r(\d\d)", code)
        if rune:
            self.values.setdefault("RUNE", int(rune.group(1)))


def label_text(rules, item, name):
    """The name BH gives the item: every matching rule's name, %NAME% the name so far, up to the first that stops."""
    for where, cond, out, cont in rules:
        undecided = []

        def atom(word):
            v = E.atom(word, item)
            if v == E.MAYBE:
                undecided.append(word)
            return v
        v = E.evaluate(cond, item, atom)
        if v == E.MAYBE:
            sys.exit(f"{item.code}: {where} needs a value for {', '.join(sorted(set(undecided)))} (the scene's values)")
        if v:
            name = out.replace("%NAME%", name)
            if not cont:
                break
    name = name.replace("%QTY%", str(item.values.get("QTY", 1))).replace("%PERCENT%", "%")
    left = [m for m in re.findall(r"%[A-Z_0-9-]+%", name) if not COLOR_RE.fullmatch(m)]
    if left:
        sys.exit(f"{item.code}: no text for {', '.join(left)} in its label {name!r}")
    return name


def segments(name):
    """The label's lines, top first, each a list of (RRGGBB, text). BH writes the bottom line first."""
    lines, color = [], "WHITE"
    for part in name.split("%NL%"):
        segs, pos = [], 0
        for m in COLOR_RE.finditer(part):
            if m.start() > pos:
                segs.append((COLORS[color], part[pos:m.start()]))
            color, pos = m.group(1), m.end()
        if pos < len(part):
            segs.append((COLORS[color], part[pos:]))
        lines.append(segs)
    return list(reversed(lines))


# ---------------------------------------------------------------- HD text

class Atlas:
    """A D2GL glyph atlas: {code point: (advance, plane box, atlas box)} in ems and atlas pixels, and its pixels."""

    def __init__(self, game, name):
        base = f"data/assets/atlases/{name}/"
        self.glyphs = {}
        for line in game.d2gl.read(base + "data.csv").decode().splitlines():
            if line.strip():
                page, cp, *nums = line.split(",")
                if page != "0":
                    raise ValueError(f"{name}: glyphs on atlas page {page}")
                nums = [float(x) for x in nums]
                self.glyphs[int(cp)] = (nums[0], nums[1:5], nums[5:9])
        self.w, self.h, bpp, self.px = png_read(game.d2gl.read(base + "0.png"))
        if bpp != 4:
            raise ValueError(f"{name}: atlas without alpha")

    def sample(self, u, v):
        """Bilinear RGBA (0..1) at atlas point (u, v), v from the top."""
        u, v = u - 0.5, v - 0.5
        x0, y0 = int(u // 1), int(v // 1)
        fx, fy = u - x0, v - y0
        px, w, out = self.px, self.w, [0.0, 0.0, 0.0, 0.0]
        for yy, wy in ((y0, 1 - fy), (y0 + 1, fy)):
            yy = min(max(yy, 0), self.h - 1)
            for xx, wx in ((x0, 1 - fx), (x0 + 1, fx)):
                xx = min(max(xx, 0), w - 1)
                p, f = (yy * w + xx) * 4, wx * wy
                out[0] += px[p] * f
                out[1] += px[p + 1] * f
                out[2] += px[p + 2] * f
                out[3] += px[p + 3] * f
        return out[0] / 255, out[1] / 255, out[2] / 255, out[3] / 255


class Font:
    """D2GL's font: its metrics line of atlases/default.txt (size, weight, letter spacing, line height, shadow,
    offset x, y, symbol offset), its glyphs, NotoSymbol's for the rest."""

    def __init__(self, game, font_id):
        for line in game.d2gl.read("data/assets/atlases/default.txt").decode().splitlines():
            cols = [c.strip() for c in line.split("|")]
            if cols[0] == str(font_id):
                break
        else:
            raise ValueError(f"no font {font_id} in d2gl.mpq's atlases/default.txt")
        (self.size, self.weight, self.spacing, self.line_height, self.shadow, self.off_x, self.off_y,
         self.symbol_off) = [float(c) for c in cols[2:10]]
        self.atlas, self.symbols = Atlas(game, cols[1]), Atlas(game, "NotoSymbol")

    def glyph(self, ch):
        """(atlas, glyph, symbol?) as D2GL's GlyphSet::getGlyph finds it."""
        cp = 0x20 if ch == "\xa0" else ord(ch)
        if cp in self.atlas.glyphs:
            return self.atlas, self.atlas.glyphs[cp], False
        return self.symbols, self.symbols.glyphs.get(cp, self.symbols.glyphs[ord("☹")]), True

    def width(self, segs):
        n = sum(len(t) for _, t in segs)
        return sum(self.glyph(ch)[1][0] for _, t in segs for ch in t) * self.size + self.spacing * self.size * (n - 1)


def smoothstep(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3 - 2 * t)


class Canvas:
    """RGB pixels, floats 0..255, with the blends D2GL draws (source alpha over)."""

    def __init__(self, w, h, rgb):
        self.w, self.h, self.px = w, h, rgb

    def blend(self, x, y, r, g, b, a):
        if a <= 0 or not (0 <= x < self.w and 0 <= y < self.h):
            return
        p, px = (y * self.w + x) * 3, self.px
        px[p] += (r - px[p]) * a
        px[p + 1] += (g - px[p + 1]) * a
        px[p + 2] += (b - px[p + 2]) * a

    def box(self, x, y, w, h, fade):
        """D2GL's label box (draw mode 6): BOX_RGBA, fading out over `fade` of its width at both ends."""
        r, g, b, a = BOX_RGBA[0] * 255, BOX_RGBA[1] * 255, BOX_RGBA[2] * 255, BOX_RGBA[3]
        for py in range(int(y + 0.5), int(y + h + 0.5)):
            for px in range(int(x + 0.5), int(x + w + 0.5)):
                u = (px + 0.5 - x) / w
                f = smoothstep(0.0, fade, u) if u < 0.5 else smoothstep(1.0, 1 - fade, u)
                self.blend(px, py, r, g, b, a * f)

    def glyph(self, atlas, g, x, y, size, rgb, font, symbol):
        """One glyph at pen (x, baseline y), size px: its shadow pass, then the glyph (D2GL's mod shader, mode 3)."""
        adv, (pl, pb, pr, pt), (al, ab, ar, at) = g
        if ar <= al:
            return
        scale = size / 32  # the atlas has 32 pixels to the em
        qx, qy = x + pl * size, y - pt * size
        if symbol:
            qy += size * font.symbol_off
        qw, qh = (ar - al) * scale, (at - ab) * scale
        weight = 1 + (font.weight - 1) * 0.5 if symbol else font.weight
        r, gg, b = (int(rgb[i:i + 2], 16) for i in (0, 2, 4))
        shade = 0.8 * 255 if r + gg + b < 0.1 * 255 * 3 else 0.0  # the shadow of dark text is light
        smooth = font.size  # D2GL: the font's size in game pixels, whatever the window's scale
        for py in range(int(qy + 0.5), int(qy + qh + 0.5)):
            v = (atlas.h - at) + (py + 0.5 - qy) / scale
            for px in range(int(qx + 0.5), int(qx + qw + 0.5)):
                u = al + (px + 0.5 - qx) / scale
                cr, cg, cb, ca = atlas.sample(u, v)
                sa = 0.0 if ca < 0.26 else smoothstep(0.0, 1.0, ca) * font.shadow
                self.blend(px, py, shade, shade, shade, sa)
                msd = max(min(cr, cg), min(max(cr, cg), cb))
                op = min(max(max(smooth, 1.0) * (msd - (1 - 0.5 * weight)) + 0.5, 0.0), 1.0)
                self.blend(px, py, r, gg, b, op)


def label_box(font, lines):
    """(width, height, fade, line widths) of a label in game pixels: D2GL's drawRectangledText for an item."""
    widths = [font.width(segs) for segs in lines]
    tw = max(widths)
    th = (len(lines) - 1) * font.size * font.line_height + font.size
    pad_x, pad_y = 3.4, max(1.4, (18.0 - font.size) / 2)
    ext = max(min(tw * 0.1, 15.0), 10.0)
    return tw + 2 * (pad_x + ext), th + 2 * pad_y, ext / (tw + 10.0), widths


def draw_label(canvas, font, lines, cx, top):
    """A label centred on cx, its box's top at top (game pixels), drawn SCALE times bigger."""
    w, h, fade, widths = label_box(font, lines)
    left = cx - w / 2
    canvas.box(left * SCALE, top * SCALE, w * SCALE, h * SCALE, fade)
    pad_y = max(1.4, (18.0 - font.size) / 2)
    lh = font.size * font.line_height
    base = top + font.size + pad_y + font.size * font.off_y  # the first line's baseline: framed text has no x offset
    for n, (segs, lw) in enumerate(zip(lines, widths)):
        x = left + (w - lw) / 2
        y = base + n * lh
        for rgb, text in segs:
            for ch in text:
                atlas, g, symbol = font.glyph(ch)
                if ch != " ":
                    canvas.glyph(atlas, g, x * SCALE, y * SCALE, font.size * SCALE, rgb, font, symbol)
                x += g[0] * font.size + font.spacing * font.size


# ---------------------------------------------------------------- the floor and the items

ISO_X = [14, 12, 10, 8, 6, 4, 2, 0, 2, 4, 6, 8, 10, 12, 14]
ISO_N = [4, 8, 12, 16, 20, 24, 28, 32, 28, 24, 20, 16, 12, 8, 4]


def dt1_floors(data):
    """{(main, sub): [(rarity, {(x, y): palette index})]}: a DT1's floor tiles (orientation 0, 160 x 80)."""
    n, ptr = struct.unpack_from("<ii", data, 268)
    tiles = {}
    for t in range(n):
        o = ptr + t * 96
        orient, main, sub, rarity = struct.unpack_from("<iiii", data, o + 20)
        if orient:
            continue
        bptr, _, nblocks = struct.unpack_from("<iii", data, o + 72)
        pixels = {}
        for b in range(nblocks):
            bx, by, _, _, _, fmt, length, _, dptr = struct.unpack_from("<hhhBBhihi", data, bptr + b * 20)
            i = bptr + dptr
            if fmt == 1:  # an isometric block: 15 rows of fixed widths
                for row in range(15):
                    for k in range(ISO_N[row]):
                        pixels[(bx + ISO_X[row] + k, by + row)] = data[i]
                        i += 1
            else:  # runs: (skip, count) pairs, (0, 0) ends a row
                end, x, y = i + length, 0, 0
                while i < end:
                    skip, count = data[i], data[i + 1]
                    i += 2
                    if not skip and not count:
                        x, y = 0, y + 1
                        continue
                    x += skip
                    for k in range(count):
                        pixels[(bx + x + k, by + y)] = data[i + k]
                    i += count
                    x += count
        tiles.setdefault((main, sub), []).append((rarity, pixels))
    return tiles


def dc6_last_frame(data):
    """(width, height, {(x, y): palette index}) of a DC6's last frame (an item's look on the ground)."""
    _, _, _, _, dirs, frames = struct.unpack_from("<iiiIii", data, 0)
    ptr = struct.unpack_from("<I", data, 24 + 4 * (dirs * frames - 1))[0]
    flip, w, h, _, _, _, _, length = struct.unpack_from("<iiiiiiii", data, ptr)
    pixels, i, end, x, y = {}, ptr + 32, ptr + 32 + length, 0, (0 if flip else h - 1)
    while i < end:
        b = data[i]
        i += 1
        if b == 0x80:
            x, y = 0, y + (1 if flip else -1)
        elif b & 0x80:
            x += b & 0x7F
        else:
            for k in range(b):
                pixels[(x + k, y)] = data[i + k]
            i += b
            x += b
    return w, h, pixels


def lit_palette(game, act, gamma):
    d = game.read(f"data/global/palette/{act}/pal.dat")
    return [tuple(255 * (d[i * 3 + c] / 255) ** gamma for c in (2, 1, 0)) for i in range(256)]


def misc_files(game):
    """{code: flippy file} from Misc.txt."""
    rows = game.read("data/global/excel/Misc.txt").decode("latin-1").splitlines()
    head = rows[0].split("\t")
    ci, fi = head.index("code"), head.index("flippyfile")
    return {c[ci]: c[fi] for c in (r.split("\t") for r in rows[1:]) if len(c) > fi}


def draw_floor(game, scene, w, h, rng):
    """The scene's floor at game resolution: RGB floats, row by row."""
    path, act, fill = scene["floor"]
    pal = lit_palette(game, act, scene["light"][0])
    tiles = dt1_floors(game.read("data/global/tiles/" + path))
    pool = [t for key in fill for t in tiles[key]]
    weights = [max(r, 0) for r, _ in pool]
    if not sum(weights):
        weights = [1] * len(pool)
    rgb = [0.0] * (w * h * 3)
    span = (w + h) // 40 + 4
    # cell (cx, cy) has its top corner at ((cx - cy) * 80, (cx + cy) * 40); cell (0, 0) is in the middle
    ox, oy = w // 2 - 80, h // 2 - 40
    for cy in range(-span, span):
        for cx in range(-span, span):
            x0, y0 = ox + (cx - cy) * 80, oy + (cx + cy) * 40
            if x0 + 160 <= 0 or x0 >= w or y0 + 80 <= 0 or y0 >= h:
                continue
            pixels = rng.choices(pool, weights)[0][1]
            for (x, y), c in pixels.items():
                X, Y = x0 + x, y0 + y
                if c and 0 <= X < w and 0 <= Y < h:
                    p = (Y * w + X) * 3
                    rgb[p], rgb[p + 1], rgb[p + 2] = pal[c]
    return rgb, pal


def light(rgb, w, h, radius):
    """A dungeon's light: full around the middle, falling off to dark past radius (game pixels)."""
    for y in range(h):
        for x in range(w):
            d = ((x - w / 2) ** 2 + ((y - h / 2) * 2) ** 2) ** 0.5 / radius  # the light is round on the floor
            f = 1.0 if d < 0.55 else max(0.0, 1 - smoothstep(0.55, 1.15, d)) * 0.85 + 0.15
            p = (y * w + x) * 3
            rgb[p] *= f
            rgb[p + 1] *= f
            rgb[p + 2] *= f


def upscale(rgb, w, h):
    """The game's frame SCALE times bigger, bilinear (the window scales the game up smoothly)."""
    W, H = w * SCALE, h * SCALE
    out = [0.0] * (W * H * 3)
    xs = []
    for X in range(W):
        sx = (X + 0.5) / SCALE - 0.5
        x0 = min(max(int(sx // 1), 0), w - 1)
        xs.append((x0, min(x0 + 1, w - 1), min(max(sx - x0, 0.0), 1.0)))
    rows = []
    for y in range(h):  # each source row scaled across first
        src = rgb[y * w * 3:(y + 1) * w * 3]
        row = [0.0] * (W * 3)
        for X, (a, b, f) in enumerate(xs):
            for c in range(3):
                row[X * 3 + c] = src[a * 3 + c] * (1 - f) + src[b * 3 + c] * f
        rows.append(row)
    for Y in range(H):
        sy = (Y + 0.5) / SCALE - 0.5
        y0 = min(max(int(sy // 1), 0), h - 1)
        y1, f = min(y0 + 1, h - 1), min(max(sy - y0, 0.0), 1.0)
        r0, r1 = rows[y0], rows[y1]
        out[Y * W * 3:(Y + 1) * W * 3] = [a * (1 - f) + b * f for a, b in zip(r0, r1)]
    return out, W, H


# ---------------------------------------------------------------- a scene

def render(game, font, rules, names, flippy, scene):
    columns = []
    for col in scene["columns"]:
        items = []
        for entry in col:
            code, own = (entry, {}) if isinstance(entry, str) else entry
            item = Item(code, {**scene["values"], **own})
            lines = segments(label_text(rules, item, names[code]))
            sprite = dc6_last_frame(game.read(f"data/global/items/{flippy[code]}.dc6"))
            items.append((code, lines, label_box(font, lines), sprite))
        columns.append(items)
    widths = [max(b[0] for _, _, b, _ in col) for col in columns]
    w = int(sum(widths) + GAP * (len(widths) - 1) + 2 * MARGIN[0])
    h = int(max(len(col) for col in columns) * ROW + 2 * MARGIN[1])
    rng = random.Random(scene["name"])
    rgb, pal = draw_floor(game, scene, w, h, rng)
    placed, x = [], MARGIN[0]
    for col, cw in zip(columns, widths):
        cx = x + cw / 2
        for n, (code, lines, box, (sw, sh, pixels)) in enumerate(col):
            top = MARGIN[1] + n * ROW
            item_top = int(top + box[1] + 3)
            sx = int(cx - sw / 2)
            for (px, py), c in pixels.items():
                X, Y = sx + px, item_top + py
                if 0 <= X < w and 0 <= Y < h:
                    p = (Y * w + X) * 3
                    rgb[p], rgb[p + 1], rgb[p + 2] = pal[c]
            placed.append((lines, cx, top))
        x += cw + GAP
    if scene["light"][1]:
        light(rgb, w, h, scene["light"][1])
    big, W, H = upscale(rgb, w, h)
    canvas = Canvas(W, H, big)
    for lines, cx, top in placed:
        draw_label(canvas, font, lines, cx, top)
    out = bytearray(min(max(int(v + 0.5), 0), 255) for v in canvas.px)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{scene['name']}.png"
    png_write(path, W, H, out)
    return path, W, H


def main():
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Draw the website's Examples pictures from the filter's rules.")
    ap.add_argument("game", help="the Diablo II folder (with ProjectD2 in it)")
    ap.add_argument("--only", choices=[s["name"] for s in SCENES], action="append")
    args = ap.parse_args()
    game = Game(args.game)
    font = Font(game, LABEL_FONT)
    rules, names, flippy = load_rules(), load_names(), misc_files(game)
    for scene in SCENES:
        if args.only and scene["name"] not in args.only:
            continue
        path, w, h = render(game, font, rules, names, flippy, scene)
        print(f"{path.relative_to(ROOT).as_posix()}: {w} x {h}")


if __name__ == "__main__":
    main()
