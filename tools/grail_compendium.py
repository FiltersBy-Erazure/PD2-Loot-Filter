#!/usr/bin/env python3
"""
The Grail Planner's Compendium view (the author, 2026-11-04): the stash Compendium's pages as the game draws them, so
a player can page through the game's Compendium and the planner side by side and tick what they've found there.

tools/grail_map.py calls build() with the game folder. It reads the Compendium's own pictures (pd2assets.mpq: the
stash panel, the cards, the buttons), every grail item's inventory picture and D2GL's font for the cards' names
(d2gl.mpq), and returns the view's data for the page and its picture sheet, Erazure-Grail-Planner-Compendium.png
(repo root, committed next to the page; website/hooks.py copies it to the site, and the page loads it the first time
the view opens).

How the Compendium shows its items (checked against the author's screenshots, 2026-11-04):
- Uniques: 6 a page, 3 x 2, in grail_map.compendium_order's order, then the hidden uniques (HIDDEN): "???", drawn
  dark (the two NO_BASE ones have no base in the tables and leave an empty place). Its 24 buttons (UNIQUE_BUTTONS)
  show one kind of item, by the base's item type.
- Sets: one set a page, its name over its cards; buttons All, Common, Uncommon and Class (SET_BUTTONS).
- Discovery Progress (the diamond button by the counter) shows all, the discovered or the undiscovered items. The page
  count ("4/73") counts every item of the button either way, so the pages past the shown ones stay empty (Uniques) or
  show the last shown set again (Sets). The counter is the tab's discovered items of all, the percent rounded down.
- A card has the red diamond when its item is discovered (in the planner: ticked). Its picture is half transparent
  unless the item lies in the Compendium (the planner can't know that, so always half), its name grey, on two lines
  when wider than 80 pixels in the game's font, cut at the space nearest the middle (NameFont).
- Hover texts (the page draws them): a button's name over the button; Discovery Progress's title, its text and the
  three ways to show, the picked one between arrows (the game writes the others' arrows in an invisible color, so
  every line keeps its place); a card's item name and base in its quality's color.
- Places in game pixels, from the panel's top left (LAYOUT); an item of w x h inventory cells sits in its card in the
  box at (17 + (2 - w) x 29 / 2, 151 - (132 - 29 h) / 2 - 29 h), both rounded toward zero, centred in it.
"""
import struct
import zlib
from pathlib import Path

import pd2_mpq
import shop_map as S  # TRANSFORMS, TRANSFORM_COLORS: the inventory pictures' color maps

ROOT = Path(__file__).resolve().parent.parent
SHEET = ROOT / "Erazure-Grail-Planner-Compendium.png"
BS = "\\"
# The Uniques' buttons, in the game's order: its name (a game string) and the item types it shows (a base's type)
UNIQUE_BUTTONS = [
    ("StashSubCategoryAll", ()), ("StashSubCategoryHelms", ("helm", "phlm", "pelt", "circ")),
    ("StashSubCategoryChests", ("tors",)), ("StashSubCategoryShields", ("shie", "shld", "head", "ashd")),
    ("StashSubCategoryGloves", ("glov",)), ("StashSubCategoryBoots", ("boot",)),
    ("StashSubCategoryBelts", ("belt", "bels")), ("StashSubCategoryQuivers", ("bowq", "xboq", "mboq", "mxbq")),
    ("StashSubCategoryAmulets", ("amul", "amus")), ("StashSubCategoryRings", ("ring",)),
    ("StashSubCategoryCharms", ("char", "scha", "mcha", "lcha")), ("StashSubCategoryAxes", ("axe",)),
    ("StashSubCategoryMaces", ("scep", "club", "hamm", "mace", "blun")),
    ("StashSubCategorySwords", ("swor", "2hsw", "crys", "2hcs")), ("StashSubCategoryDaggers", ("knif",)),
    ("StashSubCategoryThrowing", ("tkni", "taxe", "jave", "thro", "ajav")), ("StashSubCategorySpears", ("spea", "aspe")),
    ("StashSubCategoryPolearms", ("pole", "sc9")), ("StashSubCategoryBows", ("bow", "abow")),
    ("StashSubCategoryCrossbows", ("xbow",)), ("StashSubCategoryStaves", ("staf", "rod")),
    ("StashSubCategoryWands", ("wand",)), ("StashSubCategoryClaws", ("h2h", "h2h2")), ("StashSubCategoryOrbs", ("orb",))]
# The Sets' buttons: its name and its sets (Sets.txt's index)
SET_BUTTONS = [
    ("StashSubCategoryAll", ()),
    ("StashSubCategorySetCommon", ("Civerb's Vestments", "Hsarus' Defense", "Cleglaw's Brace", "Iratha's Finery",
                                   "Isenhart's Armory", "Vidala's Rig", "Milabrega's Regalia", "Cathan's Traps",
                                   "Tancred's Battlegear", "Sigon's Complete Steel", "Infernal Tools", "Berserker's Garb",
                                   "Death's Disguise", "Angelical Raiment", "Arctic Gear", "Arcanna's Tricks")),
    ("StashSubCategorySetUncommon", ("The Disciple", "Heaven's Brethren", "Orphan's Call", "Hwanin's Majesty",
                                     "Sazabi's Grand Tribute", "Bul-Kathos' Children", "Cow King's Leathers",
                                     "Naj's Ancient Set", "McAuley's Folly")),
    ("StashSubCategorySetClass", ("Natalya's Odium", "Aldur's Watchtower", "Immortal King", "Tal Rasha's Wrappings",
                                  "Griswold's Legacy", "Trang-Oul's Avatar", "M'avina's Battle Hymn"))]
# The hidden uniques the Uniques list after the others, in table order (UniqueItems' index); NO_BASE: the two with no
# base in the tables, which the buttons count as these item types
HIDDEN = {"Armageddon Blade", "Nethercrow", "Itheraels Path", "Overlords Helm", "Dark Abyss", "Aidans Scar",
          "Hadriels Hand", "Band of Skulls", "Cage of the Unsullied", "The Third Eye"}
NO_BASE = {"Armageddon Blade": "swor", "Nethercrow": "ring"}
NAME_FONT = 6  # D2GL's font for the cards' names (atlases/default.txt)
NAME_WIDTH = 80  # a name wider than this goes on two lines
CELL = 29  # an inventory cell, in game pixels
PANEL_H = 458  # the panel down to its counter row: the gold and search rows under it are left out
X0, Y0 = 15, 14  # the Compendium's own top left in the panel
# The owned items' button (show all / missing / owned: what lies in the Compendium, which the planner can't know) is
# left out, and its box in the panel's bottom left corner is painted over with the bottom right corner's ornament,
# mirrored (the author, 2026-11-04)
OWNED_BOX = [(x, y) for x in range(11, 47) for y in range(384, 428)]


def layout():
    """Every place in the panel, game pixels from its top left: the cards (3 x 2), the buttons' top lefts (Uniques: 2
    rows of 12; Sets: one row of 4, centred), Discovery Progress, the page buttons, the counter's left end and the page
    number's centre (their text baselines), the set name's plate."""
    icons = lambda n: [[X0 + (295 - min(n - r * 12, 12) * 24) // 2 + 24 * (k % 12) - 2, Y0 + 8 + 24 * r]
                       for k in range(n) for r in [k // 12]]
    return {"h": PANEL_H, "cards": [[X0 + 5 + 95 * c, Y0 + 69 + 158 * r] for r in range(2) for c in range(3)],
            "icons": {"u": icons(len(UNIQUE_BUTTONS)), "s": icons(len(SET_BUTTONS))},
            "disc": [X0 + 4, Y0 + 415], "prev": [X0 + 189, Y0 + 415], "next": [X0 + 254, Y0 + 415],
            "count": [X0 + 34, Y0 + 430], "page": [X0 + 237, Y0 + 430], "setName": [96, 55, 128, 22],
            "name": {"one": [16], "two": [15, 24]}}  # the names' baselines in a card


# ---------------------------------------------------------------- game files

class Game:
    """ProjectD2's MPQs before the base game's, as the game reads them, and D2GL's."""

    def __init__(self, folder):
        d = Path(folder)
        self.mpqs = [pd2_mpq.MPQ(str(d / "ProjectD2" / n)) for n in ("pd2assets.mpq", "pd2data.mpq", "patch_d2.mpq")]
        self.mpqs += [pd2_mpq.MPQ(str(d / n)) for n in ("d2exp.mpq", "d2data.mpq")]
        self.d2gl = pd2_mpq.MPQ(str(d / "ProjectD2" / "d2gl.mpq"))

    def read(self, *parts):
        name = BS.join(parts)
        for m in self.mpqs:
            try:
                return m.read(name)
            except KeyError:
                pass
        raise KeyError(name)


def dc6_frames(data):
    """[(width, height, {(x, y): palette index})] of every frame of a DC6."""
    dirs, n = struct.unpack_from("<ii", data, 16)
    out = []
    for ptr in struct.unpack_from(f"<{dirs * n}I", data, 24):
        flip, w, h, _, _, _, _, length = struct.unpack_from("<iiiiiiii", data, ptr)
        px, i, end, x, y = {}, ptr + 32, ptr + 32 + length, 0, (0 if flip else h - 1)
        while i < end:
            b = data[i]
            i += 1
            if b == 0x80:
                x, y = 0, y + (1 if flip else -1)
            elif b & 0x80:
                x += b & 0x7F
            else:
                for k in range(b):
                    if 0 <= y < h:
                        px[(x + k, y)] = data[i + k]
                i += b
                x += b
        out.append((w, h, px))
    return out


class NameFont:
    """The game's width of a card's name: D2GL's font NAME_FONT (its glyphs' advances, size and letter spacing), in
    whole pixels. Checked on the author's screenshots: Natalya's Totem (80.7) on one line, Hsarus' Iron Fist (83.8)
    on two."""

    def __init__(self, game):
        for line in game.d2gl.read("data/assets/atlases/default.txt").decode().splitlines():
            cols = [c.strip() for c in line.split("|")]
            if cols[0] == str(NAME_FONT):
                break
        else:
            raise ValueError(f"no font {NAME_FONT} in d2gl.mpq's atlases/default.txt")
        self.size, self.spacing = float(cols[2]), float(cols[4])
        self.adv = {}
        for line in game.d2gl.read(f"data/assets/atlases/{cols[1]}/data.csv").decode().splitlines():
            if line.strip():
                _, cp, adv, *_ = line.split(",")
                self.adv[int(cp)] = float(adv)

    def width(self, s):
        return int(sum(self.adv.get(ord(c), 0) for c in s) * self.size + self.spacing * self.size * (len(s) - 1))

    def lines(self, name):
        """The name on one line, or two: cut at the first space nearest its middle (by characters)."""
        if self.width(name) <= NAME_WIDTH or " " not in name:
            return [name]
        k = min((i for i, c in enumerate(name) if c == " "), key=lambda i: abs(i - len(name) // 2))
        return [name[:k], name[k + 1:]]


# ---------------------------------------------------------------- the picture sheet

class Sheet:
    """The pictures, packed in shelves on one sheet: an 8-bit PNG in the act 1 palette (DC6 pictures index it)."""
    WIDTH = 1024

    def __init__(self, pal):
        self.pal, self.pieces = pal, {}

    def add(self, key, frame):
        self.pieces.setdefault(key, frame)

    def pair(self, key, a, b):
        """Two frames side by side as one piece (a button and its lit look: the lit one 1 piece width to the right)."""
        (w, h, pa), (_, _, pb) = a, b
        self.add(key, (2 * w, h, {**pa, **{(x + w, y): c for (x, y), c in pb.items()}}))

    def pack(self):
        """({key: [x, y, w, h]}, PNG bytes)."""
        places, x, y, shelf = {}, 0, 0, 0
        for key, (w, h, _) in sorted(self.pieces.items(), key=lambda kv: (-kv[1][1], -kv[1][0], kv[0])):
            if x + w > self.WIDTH:
                x, y, shelf = 0, y + shelf, 0
            places[key] = [x, y, w, h]
            x, shelf = x + w, max(shelf, h)
        height = y + shelf
        used = {c for _, _, px in self.pieces.values() for c in px.values()}
        clear = next(i for i in range(256) if i not in used)  # a palette entry no picture uses: the see-through one
        rows = [bytearray([clear]) * self.WIDTH for _ in range(height)]
        for key, (px0, py0, w, h) in places.items():
            for (x, y), c in self.pieces[key][2].items():
                rows[py0 + y][px0 + x] = c
        pal = self.pal
        plte = b"".join(bytes((pal[c * 3 + 2], pal[c * 3 + 1], pal[c * 3])) for c in range(256))

        def chunk(kind, body):
            return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body))
        raw = b"".join(b"\x00" + bytes(r) for r in rows)
        png = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", self.WIDTH, height, 8, 3, 0, 0, 0))
               + chunk(b"PLTE", plte) + chunk(b"tRNS", bytes([255] * clear + [0]))
               + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))
        return places, png


def item_picture(game, t, row, kind):
    """(key, frame, inventory width, height) of a unique's or set item's picture: its own file, else its base's
    unique / set picture, else the base's; its color map applied (UniqueItems / SetItems invtransform)."""
    base = t.items[row["code" if kind == "UNI" else "item"]]
    f = row.get("invfile") or base.get("uniqueinvfile" if kind == "UNI" else "setinvfile") or base["invfile"]
    color, tr = row.get("invtransform", ""), S.num(base.get("InvTrans"))
    w, h, px = dc6_frames(game.read("data", "global", "items", f + ".dc6"))[0]
    if color in S.TRANSFORM_COLORS and 1 <= tr <= len(S.TRANSFORMS):
        maps = game.read("data", "global", "items", "Palette", S.TRANSFORMS[tr - 1] + ".dat")
        k = S.TRANSFORM_COLORS.index(color) * 256
        px = {xy: maps[k + c] for xy, c in px.items()}
    else:
        color = ""
    return f + (f"-{color}" if color else ""), (w, h, px), S.num(base["invwidth"]), S.num(base["invheight"])


def picture_place(frame, iw, ih):
    """The picture's top left in its card: centred in its cells' box (the module's docstring)."""
    w, h, _ = frame
    bx = 17 + int((2 - iw) * CELL / 2)
    by = 151 - int((132 - CELL * ih) / 2) - CELL * ih
    return bx + (iw * CELL - w) // 2, by + (ih * CELL - h) // 2


def button_of(types, buttons):
    for b, (_, kinds) in enumerate(buttons):
        if types in kinds:
            return b
    return -1  # no button but All


# ---------------------------------------------------------------- the view's data

def build(game_dir, t, items):
    """(the view's data for the page, the picture sheet's PNG bytes). items: grail_map.grail_items (with "comp")."""
    game = Game(game_dir)
    sheet = Sheet(game.read("data", "global", "palette", "ACT1", "pal.dat"))
    ui = lambda name: dc6_frames(game.read("data", "global", "ui", "PANEL", name + ".dc6"))
    stash = ui("TradeStash")  # 4 tiles a panel (256 x 256, 64 x 256, 256 x 246, 64 x 246): the Compendium's 4th and 5th
    for key, first in (("bgU", 12), ("bgS", 16)):
        px = {}
        for (w, h, tile), (tx, ty) in zip(stash[first:first + 4], ((0, 0), (256, 0), (0, 256), (256, 256))):
            px.update({(tx + x, ty + y): c for (x, y), c in tile.items() if ty + y < PANEL_H})
        for x, y in OWNED_BOX:  # the owned items' button goes: its box gets the other corner's ornament, mirrored
            c = px.get((319 - x, y))
            if c is None:
                px.pop((x, y), None)
            else:
                px[(x, y)] = c
        sheet.add(key, (320, PANEL_H, px))
    cards = ui("compendium_item")
    sheet.add("card", cards[0])
    sheet.add("cardFound", cards[2])  # the red diamond: discovered
    for prefix, name in (("u", "compendium_subcats_uniques"), ("s", "compendium_subcats_sets")):
        frames = ui(name)
        for b in range(len(frames) // 2):
            sheet.pair(f"{prefix}{b}", frames[2 * b], frames[2 * b + 1])
    pages = ui("paginatebtn")
    sheet.add("next", pages[0])
    sheet.add("prev", pages[2])
    buttons = ui("compendium_btn")
    for mode in range(3):  # Discovery Progress: show all, the discovered, the undiscovered
        sheet.add(f"disc{mode}", buttons[mode])
    cats = ui("stashcategories")
    sheet.pair("cat", cats[2], cats[3])  # the Uniques and Sets buttons, and the one picked

    font = NameFont(game)
    type_of = lambda code: t.items[code]["type"]

    def card(i, kind, row, button_list, lines, set_no=None):
        key, frame, iw, ih = item_picture(game, t, row, kind)
        sheet.add(key, frame)
        x, y = picture_place(frame, iw, ih)
        out = [i, button_of(type_of(row["code" if kind == "UNI" else "item"]), button_list), lines, key, x, y]
        if set_no is not None:
            out.append(set_no)
        return out
    uniques = sorted((it for it in items if it["kind"] == "UNI"), key=lambda it: it["comp"])
    index = {id(it): n for n, it in enumerate(items)}
    u_cards = [card(index[id(it)], "UNI", t.uniques[it["uids"][0]], UNIQUE_BUTTONS, font.lines(it["name"]))
               for it in uniques]
    for row in t.uniques:  # the hidden uniques, in table order
        if row.get("index") not in HIDDEN:
            continue
        if row["index"] in NO_BASE:  # an empty place
            u_cards.append([-2, button_of(NO_BASE[row["index"]], UNIQUE_BUTTONS), [], "", 0, 0])
        else:
            u_cards.append(card(-1, "UNI", row, UNIQUE_BUTTONS, ["???"]))
    hidden = sum(1 for row in t.uniques if row.get("index") in HIDDEN)
    assert hidden == len(HIDDEN), f"hidden uniques missing from the tables: {len(HIDDEN) - hidden}"

    set_rows = {r["index"]: r for r in t.sets if r.get("item")}
    set_button = {s: b for b, (_, sets) in enumerate(SET_BUTTONS) for s in sets}
    missing = [s for s in t.set_names if s != "Expansion" and s not in set_button]
    assert not missing, f"sets with no Compendium button (SET_BUTTONS): {missing}"
    set_names, s_cards = [], []
    for it in sorted((it for it in items if it["kind"] == "SET"), key=lambda it: it["comp"]):
        row = set_rows[it["index"]]
        if not set_names or set_names[-1] != it["set"]:
            set_names.append(it["set"])
        c = card(index[id(it)], "SET", row, SET_BUTTONS, font.lines(it["name"]), set_no=len(set_names) - 1)
        c[1] = set_button[row["set"]]
        s_cards.append(c)
    places, png = sheet.pack()
    data = {"file": SHEET.name, "size": [Sheet.WIDTH, max(p[1] + p[3] for p in places.values())], "art": places,
            "layout": layout(), "u": u_cards, "s": s_cards, "sets": set_names,
            "buttons": {"u": [t.names.get(k, k) for k, _ in UNIQUE_BUTTONS],
                        "s": [t.names.get(k, k) for k, _ in SET_BUTTONS]},
            "words": {k: t.names.get(k, k) for k in ("StashCategoryUniques", "StashCategorySets",
                                                     "CompendiumFilterDiscoveryProgress", "CompendiumFilterShowAll",
                                                     "CompendiumFilterShowDiscovered", "CompendiumFilterShowUndiscovered")}}
    # Discovery Progress's hover text: its title, this text (the game draws a text's lines bottom up: the last on top)
    # and the three ways to show, the arrows on the one picked
    data["words"]["discDesc"] = t.names["CompendiumFilterDiscoveryDesc"].split("\n")[::-1]
    return data, png
