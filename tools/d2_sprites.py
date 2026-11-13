#!/usr/bin/env python3
"""
Diablo II's animated sprites: the DCC picture format (one file per body part, look and animation) and the COF files
that say which parts an animation has and in what order they are drawn, frame by frame. For the IAS Calculator's
attack previews (tools/ias_sprites.py).

DCC, written from the format's description: a file holds directions, each a bit stream (bits taken from the low
end of each byte first). A direction's frames are cut into cells of 4 x 4 pixels on one grid; a cell keeps up to 4
colours (indices into the 256 the direction lists as used). Frame by frame, a cell either repeats the last frame's
cell at that spot ("equal cell"), or says which of its 4 colours change (a 4-bit mask) and reads the new ones (raw 8
bits, or a step from the last colour in 4-bit pieces); then every pixel of a new cell picks one of its colours with
0, 1 or 2 bits. Colour 0 is transparent.

COF: a header (layers, frames, directions, the animation's box), one record per layer (its body part, shadow,
transparency and weapon class), the frames' event bytes, then for each direction and frame the layers' drawing
order.
"""
import struct

BITS = [0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 26, 28, 30, 32]
COMPONENTS = ["HD", "TR", "LG", "RA", "LA", "RH", "LH", "SH", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]


class Bits:
    def __init__(self, data, pos=0):
        self.data, self.pos = data, pos

    def read(self, n):
        v = 0
        for i in range(n):
            byte = self.data[self.pos >> 3] if (self.pos >> 3) < len(self.data) else 0
            v |= ((byte >> (self.pos & 7)) & 1) << i
            self.pos += 1
        return v

    def signed(self, n):
        v = self.read(n)
        return v - (1 << n) if n and v & (1 << (n - 1)) else v


def cof(data):
    """{layers: [(component, shadow, trans, weapon class)], frames, directions, events, order: [dir][frame] ->
    [component]}"""
    nl, nf, nd = data[0], data[1], data[2]
    box = struct.unpack_from("<4i", data, 8)  # xmin, xmax, ymin, ymax
    pos = 28
    layers = []
    for _ in range(nl):
        comp, shadow, sel, ovr, trans = data[pos:pos + 5]
        wc = data[pos + 5:pos + 9].split(b"\0")[0].decode("latin-1").upper()
        layers.append({"comp": COMPONENTS[comp], "shadow": shadow, "trans": ovr and trans, "wc": wc})
        pos += 9
    events = list(data[pos:pos + nf])
    pos += nf
    order = []
    for d in range(nd):
        frames = []
        for f in range(nf):
            frames.append([COMPONENTS[c] for c in data[pos:pos + nl]])
            pos += nl
        order.append(frames)
    return {"layers": layers, "frames": nf, "directions": nd, "events": events, "order": order, "box": box}


def dcc_directions(data):
    return data[2]


def dcc(data, direction):
    """The frames of one direction: [{x, y, w, h, px}] where (x, y) is the frame's top-left corner relative to the
    unit's feet and px holds w x h palette indices (0 = transparent)."""
    ndir, nframes = data[2], struct.unpack_from("<I", data, 3)[0]
    off = struct.unpack_from("<I", data, 15 + 4 * direction)[0]
    b = Bits(data, off * 8)
    b.read(32)  # the direction's size, coded
    flags = b.read(2)
    v0, wb, hb, xb, yb, ob, cb = (BITS[b.read(4)] for _ in range(7))
    frames = []
    for _ in range(nframes):
        b.read(v0)
        w, h = b.read(wb), b.read(hb)
        x, y = b.signed(xb), b.signed(yb)
        opt, coded = b.read(ob), b.read(cb)
        up = b.read(1)
        y0 = y if up else y - h + 1
        frames.append({"x": x, "y": y0, "w": w, "h": h, "up": up, "opt": opt})
    if any(f["opt"] for f in frames):
        b.pos = (b.pos + 7) & ~7
        b.pos += 8 * sum(f["opt"] for f in frames)
    eq_size = b.read(20) if flags & 2 else 0
    mask_size = b.read(20)
    enc_size, raw_size = (b.read(20), b.read(20)) if flags & 1 else (0, 0)
    values = [i for i in range(256) if b.read(1)]
    eq = Bits(data, b.pos)
    mask = Bits(data, eq.pos + eq_size)
    enc = Bits(data, mask.pos + mask_size)
    raw = Bits(data, enc.pos + enc_size)
    code = Bits(data, raw.pos + raw_size)

    xmin = min(f["x"] for f in frames)
    ymin = min(f["y"] for f in frames)
    xmax = max(f["x"] + f["w"] - 1 for f in frames)
    ymax = max(f["y"] + f["h"] - 1 for f in frames)
    dw, dh = xmax - xmin + 1, ymax - ymin + 1
    cw = 1 + (dw - 1) // 4  # the direction's cell grid

    def cells(f):
        """The frame's cells: (direction cell index, x and y in the direction, width, height), row by row."""
        def cuts(start, size):
            first = 4 - (start % 4)
            if size - first <= 1:
                return [size]
            rest = size - first - 1
            n = 2 + rest // 4 - (1 if rest % 4 == 0 else 0)
            out = [first] + [4] * (n - 2)
            out.append(size - sum(out))
            return out
        fx, fy = f["x"] - xmin, f["y"] - ymin
        ws, hs = cuts(fx, f["w"]), cuts(fy, f["h"])
        out, yy = [], fy
        for j, ch in enumerate(hs):
            xx = fx
            for i, cwid in enumerate(ws):
                out.append(((fy // 4 + j) * cw + fx // 4 + i, xx, yy, cwid, ch))
                xx += cwid
            yy += ch
        return out

    # stage 1: each cell's colours, frame by frame
    buffer = {}  # direction cell -> its last colours
    entries = []  # (frame, cell number in the frame, colours)
    for n, f in enumerate(frames):
        for k, (cell, *_rest) in enumerate(cells(f)):
            if cell in buffer:
                if eq_size and eq.read(1):
                    continue  # an equal cell: the last frame's pixels stay
                m = mask.read(4)
            else:
                m = 0x0F
            count = bin(m).count("1")
            read, last = [], 0
            as_raw = enc.read(1) if enc_size and count else 0  # one bit per cell: its new colours raw, or as steps
            for _ in range(count):
                if as_raw:
                    v = raw.read(8)
                else:
                    v = last
                    while True:
                        step = code.read(4)
                        v += step
                        if step != 15:
                            break
                if v == last:
                    break  # this and the rest of the cell's new colours are 0
                read.append(v)
                last = v
            # the changed slots, lowest first, take the decoded colours from the last one back, then 0
            old = buffer.get(cell, [0, 0, 0, 0])
            new = []
            for i in range(4):
                new.append((read.pop() if read else 0) if m & (1 << i) else old[i])
            buffer[cell] = new
            entries.append((n, k, new))

    # stage 2: the pixels
    canvas = bytearray(dw * dh)
    last_at = {}  # direction cell -> where its pixels were drawn last (x, y, w, h)
    out = []
    e = 0
    for n, f in enumerate(frames):
        for k, (cell, x0, y0, w, h) in enumerate(cells(f)):
            if e < len(entries) and entries[e][0] == n and entries[e][1] == k:
                vals = entries[e][2]
                e += 1
                nb = 0 if vals[0] == vals[1] else 1 if vals[1] == vals[2] else 2
                for yy in range(h):
                    row = (y0 + yy) * dw + x0
                    for xx in range(w):
                        canvas[row + xx] = values[vals[code.read(nb)]] if values else 0
            else:  # an equal cell: the last frame's pixels of this cell, moved to where it is now, or cleared
                lx, ly, lw, lh = last_at.get(cell, (x0, y0, -1, -1))
                rows = [bytes(canvas[(ly + yy) * dw + lx:(ly + yy) * dw + lx + w]) if (lw, lh) == (w, h) else bytes(w)
                        for yy in range(h)]
                for yy in range(h):
                    canvas[(y0 + yy) * dw + x0:(y0 + yy) * dw + x0 + w] = rows[yy]
            last_at[cell] = (x0, y0, w, h)
        fx, fy = f["x"] - xmin, f["y"] - ymin
        px = bytearray(f["w"] * f["h"])
        for yy in range(f["h"]):
            px[yy * f["w"]:(yy + 1) * f["w"]] = canvas[(fy + yy) * dw + fx:(fy + yy) * dw + fx + f["w"]]
        out.append({"x": f["x"], "y": f["y"], "w": f["w"], "h": f["h"], "px": bytes(px)})
    return out
