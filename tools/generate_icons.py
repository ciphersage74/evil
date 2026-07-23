#!/usr/bin/env python3
"""Génère icône / splash / favicon en PNG pur (sans dépendance externe)."""
import math
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "assets")


def write_png(path, w, h, pixels):
    """pixels : fonction (x,y)->(r,g,b,a)."""
    raw = bytearray()
    for y in range(h):
        raw.append(0)  # filtre "None"
        for x in range(w):
            raw += bytes(pixels(x, y))
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def in_circle(x, y, cx, cy, r):
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def make_icon(size, transparent_bg=False):
    top = (27, 42, 107)     # bleu nuit clair
    bottom = (8, 12, 30)    # bleu nuit profond
    moon = (255, 233, 168)
    cloud = (236, 241, 255)
    drop = (127, 178, 255)

    cx, cy, r = size * 0.62, size * 0.34, size * 0.13      # lune
    sx = cx + size * 0.05                                  # masque croissant

    def px(x, y):
        # Lune (croissant)
        if in_circle(x, y, cx, cy, r):
            if not in_circle(x, y, sx, cy - size * 0.02, r):
                return (*moon, 255)
        # Nuage : trois bulles
        for (bx, by, br) in [(0.40, 0.56, 0.13), (0.52, 0.52, 0.15), (0.62, 0.57, 0.12)]:
            if in_circle(x, y, size * bx, size * by, size * br):
                return (*cloud, 255)
        if size * 0.40 <= x <= size * 0.62 and size * 0.56 <= y <= size * 0.63:
            return (*cloud, 255)
        # Gouttes
        for dx in (0.43, 0.51, 0.59):
            if in_circle(x, y, size * dx, size * 0.72, size * 0.022):
                return (*drop, 255)
        if transparent_bg:
            return (0, 0, 0, 0)
        return (*lerp(top, bottom, y / size), 255)

    return px


def main():
    os.makedirs(OUT, exist_ok=True)
    print("icon.png …");        write_png(os.path.join(OUT, "icon.png"), 1024, 1024, make_icon(1024))
    print("adaptive-icon.png …"); write_png(os.path.join(OUT, "adaptive-icon.png"), 1024, 1024, make_icon(1024, transparent_bg=True))
    print("splash.png …");      write_png(os.path.join(OUT, "splash.png"), 1024, 1024, make_icon(1024))
    print("favicon.png …");     write_png(os.path.join(OUT, "favicon.png"), 96, 96, make_icon(96))
    print("Terminé.")


if __name__ == "__main__":
    main()
