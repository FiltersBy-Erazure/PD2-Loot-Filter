#!/usr/bin/env python3
"""
Read one file out of a PD2 MPQ archive (e.g. ProjectD2\\pd2data.mpq), standard library only.

MPQ format 1 (hash and block tables, encrypted files, zlib / bzip2 / PKWARE DCL "implode" sectors), enough
for pd2data.mpq. The explode decoder is a port of zlib's contrib/blast/blast.c (Mark Adler).

    python tools/pd2_mpq.py <archive.mpq> --list
    python tools/pd2_mpq.py <archive.mpq> "data\\global\\excel\\ItemStatCost.txt" > ItemStatCost.txt
"""
import bz2
import struct
import sys
import zlib

CRYPT = [0] * 1280
_seed = 0x00100001
for _i in range(256):
    _idx = _i
    for _ in range(5):
        _seed = (_seed * 125 + 3) % 0x2AAAAB
        _hi = (_seed & 0xFFFF) << 16
        _seed = (_seed * 125 + 3) % 0x2AAAAB
        CRYPT[_idx] = _hi | (_seed & 0xFFFF)
        _idx += 256


def hash_str(s, kind):
    s1, s2 = 0x7FED7FED, 0xEEEEEEEE
    for ch in s.upper().replace("/", "\\"):
        c = ord(ch)
        s1 = CRYPT[kind * 256 + c] ^ ((s1 + s2) & 0xFFFFFFFF)
        s2 = (c + s1 + s2 + (s2 << 5) + 3) & 0xFFFFFFFF
    return s1


def decrypt(data, key):
    out = bytearray()
    seed2 = 0xEEEEEEEE
    for i in range(len(data) // 4):
        seed2 = (seed2 + CRYPT[0x400 + (key & 0xFF)]) & 0xFFFFFFFF
        v = struct.unpack_from("<I", data, i * 4)[0] ^ ((key + seed2) & 0xFFFFFFFF)
        key = ((((~key) << 0x15) + 0x11111111) | (key >> 0x0B)) & 0xFFFFFFFF
        seed2 = (v + seed2 + (seed2 << 5) + 3) & 0xFFFFFFFF
        out += struct.pack("<I", v)
    return bytes(out) + data[len(data) // 4 * 4:]


# ---------------------------------------------------------------- PKWARE DCL explode (blast.c)

MAXBITS = 13
LITLEN = [11, 124, 8, 7, 28, 7, 188, 13, 76, 4, 10, 8, 12, 10, 12, 10, 8, 23, 8, 9, 7, 6, 7, 8, 7, 6, 55, 8, 23,
          24, 12, 11, 7, 9, 11, 12, 6, 7, 22, 5, 7, 24, 6, 11, 9, 6, 7, 22, 7, 11, 38, 7, 9, 8, 25, 11, 8, 11, 9,
          12, 8, 12, 5, 38, 5, 38, 5, 11, 7, 5, 6, 21, 6, 10, 53, 8, 7, 24, 10, 27, 44, 253, 253, 253, 252, 252,
          252, 13, 12, 45, 12, 45, 12, 61, 12, 45, 44, 173]
LENLEN = [2, 35, 36, 53, 38, 23]
DISTLEN = [2, 20, 53, 230, 247, 151, 248]
BASE = [3, 2, 4, 5, 6, 7, 8, 9, 10, 12, 16, 24, 40, 72, 136, 264]
EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8]


def _construct(rep):
    lengths = []
    for b in rep:
        lengths += [b & 15] * ((b >> 4) + 1)
    count = [0] * (MAXBITS + 1)
    for n in lengths:
        count[n] += 1
    offs = [0] * (MAXBITS + 1)
    for n in range(1, MAXBITS):
        offs[n + 1] = offs[n] + count[n]
    symbol = [0] * len(lengths)
    for s, n in enumerate(lengths):
        if n:
            symbol[offs[n]] = s
            offs[n] += 1
    return count, symbol


LIT, LEN, DIST = _construct(LITLEN), _construct(LENLEN), _construct(DISTLEN)


def explode(data):
    pos, bitbuf, bitcnt = 0, 0, 0
    out = bytearray()

    def bits(n):
        nonlocal pos, bitbuf, bitcnt
        while bitcnt < n:
            bitbuf |= data[pos] << bitcnt
            pos += 1
            bitcnt += 8
        v = bitbuf & ((1 << n) - 1)
        bitbuf >>= n
        bitcnt -= n
        return v

    def decode(h):
        count, symbol = h
        code = first = index = 0
        for length in range(1, MAXBITS + 1):
            code |= bits(1) ^ 1  # the codes are stored bit-inverted
            if code < first + count[length]:
                return symbol[index + code - first]
            index += count[length]
            first = (first + count[length]) << 1
            code <<= 1
        raise ValueError("explode: bad code")

    lit, dct = bits(8), bits(8)
    if lit > 1 or not 4 <= dct <= 6:
        raise ValueError(f"explode: bad header {lit} {dct}")
    while True:
        if bits(1):
            sym = decode(LEN)
            length = BASE[sym] + bits(EXTRA[sym])
            if length == 519:
                break
            shift = 2 if length == 2 else dct
            dist = (decode(DIST) << shift) + bits(shift) + 1
            for _ in range(length):
                out.append(out[-dist])
        else:
            out.append(decode(LIT) if lit else bits(8))
    return bytes(out)


# ---------------------------------------------------------------- archive

class MPQ:
    def __init__(self, path):
        with open(path, "rb") as f:
            raw = f.read()
        self.base = 0
        while raw[self.base:self.base + 4] != b"MPQ\x1a":
            self.base += 512
            if self.base >= len(raw):
                raise ValueError(f"{path}: not an MPQ archive")
        _, _, _, _, shift, ht, bt, hn, bn = struct.unpack_from("<4sIIHHIIII", raw, self.base)
        self.raw, self.sector = raw, 512 << shift
        h = decrypt(raw[self.base + ht:self.base + ht + hn * 16], hash_str("(hash table)", 3))
        b = decrypt(raw[self.base + bt:self.base + bt + bn * 16], hash_str("(block table)", 3))
        self.hashes = [struct.unpack_from("<IIHHI", h, i * 16) for i in range(hn)]
        self.blocks = [struct.unpack_from("<IIII", b, i * 16) for i in range(bn)]

    def find(self, name):
        n = len(self.hashes)
        i = hash_str(name, 0) % n
        a, b = hash_str(name, 1), hash_str(name, 2)
        for _ in range(n):
            ha, hb, _, _, blk = self.hashes[i]
            if blk == 0xFFFFFFFF:
                return None
            if ha == a and hb == b and blk != 0xFFFFFFFE:
                return self.blocks[blk]
            i = (i + 1) % n
        return None

    def read(self, name):
        blk = self.find(name)
        if not blk:
            raise KeyError(name)
        off, psize, usize, flags = blk
        data = self.raw[self.base + off:self.base + off + psize]
        key = None
        if flags & 0x10000:  # encrypted
            key = hash_str(name.replace("/", "\\").split("\\")[-1], 3)
            if flags & 0x20000:
                key = ((key + off) ^ usize) & 0xFFFFFFFF
        imploded, compressed = flags & 0x100, flags & 0x200
        if flags & 0x1000000:  # single unit
            if key is not None:
                data = decrypt(data, key)
            return self._unpack(data, usize, imploded, compressed) if psize < usize else data
        count = (usize + self.sector - 1) // self.sector
        if not imploded and not compressed:
            return b"".join(self._sector(data[i * self.sector:(i + 1) * self.sector], key, i) for i in range(count))
        table = data[:(count + 1) * 4]
        if key is not None:
            table = decrypt(table, (key - 1) & 0xFFFFFFFF)
        offs = struct.unpack_from(f"<{count + 1}I", table)
        out = b""
        for i in range(count):
            chunk = self._sector(data[offs[i]:offs[i + 1]], key, i)
            want = min(self.sector, usize - i * self.sector)
            out += self._unpack(chunk, want, imploded, compressed) if len(chunk) < want else chunk
        return out

    @staticmethod
    def _sector(chunk, key, i):
        return chunk if key is None else decrypt(chunk, (key + i) & 0xFFFFFFFF)

    @staticmethod
    def _unpack(chunk, want, imploded, compressed):
        if imploded:
            return explode(chunk)
        method, body = chunk[0], chunk[1:]
        if method == 0x02:
            return zlib.decompress(body)
        if method == 0x10:
            return bz2.decompress(body)
        if method == 0x08:
            return explode(body)
        raise ValueError(f"unsupported MPQ compression 0x{method:02x}")


if __name__ == "__main__":
    archive = MPQ(sys.argv[1])
    if sys.argv[2] == "--list":
        print(archive.read("(listfile)").decode("latin-1"))
    else:
        sys.stdout.buffer.write(archive.read(sys.argv[2]))
