#!/usr/bin/env python3
"""
The two decompressions Blizzard's MPQs use for sounds (d2sfx.mpq's WAV files: Huffman, then IMA-style ADPCM), for
tools/pd2_mpq.py. A port of StormLib's src/huffman/huff.cpp and src/adpcm/adpcm.cpp (Ladislav Zezula,
github.com/ladislav-zezula/StormLib, MIT license), the byte weight tables copied from huff.cpp. Standard library only.

    huffman(data, size)          the Huffman-coded sector (its first byte: the weight table) -> at most size bytes
    adpcm(data, size, channels)  the ADPCM sector (a zero, the bit shift, each channel's first sample) -> 16-bit PCM
"""

# DataDistributions: the starting weight of each byte value, per data type (the stream's first byte)
WEIGHTS = [
    # Sparse
    bytes.fromhex(
        "0a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000002"),
    # Binary
    bytes.fromhex(
        "5416160d0c08060506050603040403050e0b141313090b0605040302030202020d070906060403020403030303030202"
        "090604040404030203020202020302040803040709050303030302020203020203020202020202020201010102010202"
        "060a0808060704030404020204020303040307070906040303020102020202020a020203020201010202020603050203"
        "0201010101010101010101020301010102010101010101020404040709080c0201010101010101010101010102010103"
        "040102040501010101010101020101010401010101010201010101010101010102010101010101010301010101010101"
        "0201010101010102020101020202064b"),
    # Text
    bytes.fromhex(
        "0000000000000000000327000023000000000000000000000000000000000000ff0101010101010102020101060e1004"
        "060805040403030202030301010201010104020402020201010401010203030203010306040101010101010201020101"
        "0129071612400a0a112501031710262a100123232f100607020901010101010000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000000"),
    # General
    bytes.fromhex(
        "ff0b07050b020202060202010402010309010101030401010201010102010101050101010d0101010101010101010101"
        "020101030101010101010102010101010a04020106030201010101010301010105020304030303020101010201020303"
        "01030101020501010403050103010303020104030a06010101010101010101010202010a020501010207021701050101"
        "0e0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101"
        "060201040501010201010101020101010101010101010101010101010101010101010101010101010701010201010101"
        "02010101010101010201010101010111"),
    # ADPCM_4
    bytes.fromhex(
        "fffb989a848563643e3e2222131318170000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000000"),
    # ADPCM_6
    bytes.fromhex(
        "fff19d9e9a9b9a9793938c8e868880827c7c7273696b5f6055564a4b404137372f2f272721211b1c1717131310100d0d"
        "0b0b09090808070706050504040419180000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000000"),
    # Stereo_3
    bytes.fromhex(
        "c3cbf541ff7bf72100000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000000bfccf240fd7cf722000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000000000000000000000000000000000000007a460000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000000"),
    # Stereo_4
    bytes.fromhex(
        "c3d9ef3df97ce91efdabf12cfc5bfe170000000000000000000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000000bdd9ec3df57de81dfbaef02cfb5cff1800000000000000000000000000000000"
        "0000000000000000000000000000000000000000000000000000000000000000706c0000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000000"),
    # Stereo_5
    bytes.fromhex(
        "bac5da33e36dd818e594da23df4ad110eeafe42cea5ade15f487e921f643fc1200000000000000000000000000000000"
        "00000000000000000000000000000000b0c7d833e36bd618e795d823db49d011e9b2e22be85cdd15f187e720f744ff13"
        "00000000000000000000000000000000000000000000000000000000000000005f9e0000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        "00000000000000000000000000000000"),
]


class _Item:
    __slots__ = ("next", "prev", "value", "weight", "parent", "child")

    def __init__(self):
        self.next = self.prev = self.parent = self.child = None
        self.value = self.weight = 0

    def remove(self):
        if self.next is not None:
            self.prev.next = self.next
            self.next.prev = self.prev
            self.next = self.prev = None


class _Tree:
    """THuffmannTree: items in a list sorted by weight (head.next the heaviest), each with its parent and its
    lower-weight child (the higher-weight one is that child's prev)."""

    def __init__(self):
        self.head = _Item()
        self.head.next = self.head.prev = self.head
        self.by_byte = [None] * 258
        self.used = 0

    @staticmethod
    def link(a, b):  # b after a
        b.next = a.next
        b.prev = a.next.prev
        a.next.prev = b
        a.next = b

    def insert(self, item, after, at=None):
        item.remove()
        at = at or self.head
        self.link(at if after else at.prev, item)

    def higher_or_equal(self, item, weight):
        while item is not None and item is not self.head:
            if item.weight >= weight:
                return item
            item = item.prev
        return self.head

    def new_item(self, value, weight, after):
        if self.used >= 515:
            raise ValueError("Huffman tree full")
        self.used += 1
        item = _Item()
        self.insert(item, after)
        item.value, item.weight = value, weight
        return item

    def fixup(self, item, max_weight):
        if item.weight < max_weight:
            higher = self.higher_or_equal(self.head.prev, item.weight)
            item.remove()
            self.link(higher, item)
            return max_weight
        return item.weight

    def build(self, kind):
        kind &= 0x0F
        if kind >= len(WEIGHTS):
            raise ValueError(f"Huffman data type {kind}")
        table, max_weight = WEIGHTS[kind], 0
        for i in range(256):
            if table[i]:
                self.by_byte[i] = item = self.new_item(i, table[i], True)
                max_weight = self.fixup(item, max_weight)
        self.by_byte[0x100] = self.new_item(0x100, 1, False)
        self.by_byte[0x101] = self.new_item(0x101, 1, False)
        lo = self.head.prev
        while lo is not self.head:
            hi = lo.prev
            if hi is self.head:
                break
            parent = self.new_item(0, hi.weight + lo.weight, True)
            lo.parent = hi.parent = parent
            parent.child = lo
            max_weight = self.fixup(parent, max_weight)
            lo = hi.prev

    def inc_weights(self, item):
        while item is not None:
            item.weight += 1
            higher = self.higher_or_equal(item.prev, item.weight)
            hi = higher.next
            if hi is not item:
                hi.remove()
                self.link(item, hi)
                item.remove()
                self.link(higher, item)
                lo = hi.parent.child
                parent = item.parent
                if parent.child is item:
                    parent.child = hi
                if lo is hi:
                    hi.parent.child = item
                parent = item.parent
                item.parent = hi.parent
                hi.parent = parent
            item = item.parent

    def new_branch(self, value1, value2):
        last = self.head.prev
        hi = self.new_item(value1, last.weight, False)
        hi.parent = last
        self.by_byte[value1] = hi
        lo = self.new_item(value2, 0, False)
        lo.parent = last
        last.child = lo
        self.by_byte[value2] = lo
        self.inc_weights(lo)


class _Bits:
    def __init__(self, data):
        self.data, self.pos, self.buf, self.count = data, 0, 0, 0

    def bit(self):
        if self.count == 0:
            if self.pos >= len(self.data):
                return None
            self.buf, self.count = self.data[self.pos], 8
            self.pos += 1
        v = self.buf & 1
        self.buf >>= 1
        self.count -= 1
        return v

    def byte(self):
        if self.count < 8:
            if self.pos >= len(self.data):
                return None
            self.buf |= self.data[self.pos] << self.count
            self.pos += 1
            self.count += 8
        v = self.buf & 0xFF
        self.buf >>= 8
        self.count -= 8
        return v


def huffman(data, size):
    """THuffmannTree::Decompress."""
    bits = _Bits(data)
    kind = bits.byte()
    if kind is None or size == 0:
        return b""
    sparse = kind == 0
    tree = _Tree()
    tree.build(kind)
    out = bytearray()
    while True:
        item = tree.head.next
        if item is tree.head:
            raise ValueError("empty Huffman tree")
        while item.child is not None:
            b = bits.bit()
            if b is None:
                raise ValueError("Huffman stream ended")
            item = item.child.prev if b else item.child
        value = item.value
        if value == 0x100:
            break
        if value == 0x101:
            value = bits.byte()
            if value is None:
                raise ValueError("Huffman stream ended")
            tree.new_branch(tree.head.prev.value, value)
            if not sparse:
                tree.inc_weights(tree.by_byte[value])
        if len(out) >= size:
            break
        out.append(value)
        if sparse:
            tree.inc_weights(tree.by_byte[value])
    return bytes(out)


NEXT_STEP = [-1, 0, -1, 4, -1, 2, -1, 6, -1, 1, -1, 5, -1, 3, -1, 7,
             -1, 1, -1, 5, -1, 3, -1, 7, -1, 2, -1, 4, -1, 6, -1, 8]
STEP_SIZE = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88,
             97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658,
             724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660,
             4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818,
             18500, 20350, 22385, 24623, 27086, 29794, 32767]


def adpcm(data, size, channels):
    """DecompressADPCM: 16-bit little-endian PCM, at most size bytes."""
    out = bytearray()
    if len(data) < 2:
        return b""
    shift, pos = data[1], 2
    predicted, steps = [0, 0], [0x2C, 0x2C]
    for c in range(channels):
        if pos + 2 > len(data) or len(out) + 2 > size:
            return bytes(out)
        s = int.from_bytes(data[pos:pos + 2], "little", signed=True)
        pos += 2
        predicted[c] = s
        out += (s & 0xFFFF).to_bytes(2, "little")
    ch = channels - 1
    while pos < len(data):
        enc = data[pos]
        pos += 1
        ch = (ch + 1) % channels
        if enc == 0x80:
            if steps[ch]:
                steps[ch] -= 1
            if len(out) + 2 > size:
                break
            out += (predicted[ch] & 0xFFFF).to_bytes(2, "little")
        elif enc == 0x81:
            steps[ch] = min(steps[ch] + 8, 0x58)
            ch = (ch + 1) % channels
        else:
            step = STEP_SIZE[steps[ch]]
            diff = step >> shift
            for bit, sh in ((0x01, 0), (0x02, 1), (0x04, 2), (0x08, 3), (0x10, 4), (0x20, 5)):
                if enc & bit:
                    diff += step >> sh
            p = predicted[ch]
            p = max(p - diff, -32768) if enc & 0x40 else min(p + diff, 32767)
            predicted[ch] = p
            if len(out) + 2 > size:
                break
            out += (p & 0xFFFF).to_bytes(2, "little")
            steps[ch] = max(0, min(88, steps[ch] + NEXT_STEP[enc & 0x1F]))
    return bytes(out)
