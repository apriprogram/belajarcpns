#!/usr/bin/env python3
"""Generator soal TIU figural (gambar) — Bank Soal SKD 2027.

Membuat 80 soal orisinal (8 per paket x 10 paket):
  Figural – Analogi 3, Figural – Ketidaksamaan 2, Figural – Serial 3
dan menulis:
  data/bank-soal-2027/figural/pNN-<jenis>-<i>.png
  data/bank-soal-2027/figural/figural.json   {"questions": [...]}

Deterministik (seed tetap). Setiap gambar dibangun dari *state* parametris; aturan (rotasi,
pencerminan, jumlah titik, isian, perpindahan, sisi, ukuran, gabungan/XOR, selang-seling) bekerja
pada state. Kunci dibangun dari aturan; pengecoh dibangun dengan melanggar aturan secara spesifik.

Pemeriksaan otomatis (gagal = exit 1):
  * pemecah (solver) independen menelusuri pustaka aturan tunggal -> pasangan -> selang-seling/
    gabungan, mencari SEMUA aturan yang cocok dengan soal, lalu memastikan semua aturan pada tingkat
    paling sederhana memprediksi gambar yang sama dan gambar itu = tepat satu opsi (opsi kunci);
  * kelima opsi berbeda secara visual (perbandingan bitmap);
  * ketidaksamaan: invarian dihitung ulang (sebagian dari bitmap: jumlah daerah tertutup, simetri),
    tepat satu opsi menyimpang, dan tidak ada invarian lain yang menunjuk opsi berbeda;
  * konvensi gambar: putar 90° searah jarum jam == np.rot90(k=-1), cermin kiri-kanan == fliplr, dst.;
  * tidak ada dua soal dengan aturan+parameter+bangun dasar yang sama; kunci tersebar rata A–E.

Pemakaian:  python -I scripts/bank-soal/figural.py [--preview]
"""
import json
import math
import os
import random
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
OUT_DIR = os.path.join(ROOT, "data", "bank-soal-2027", "figural")
SEED = 2027
P = 150            # ukuran panel (px)
SS = 4             # supersampling
U = P / 2 * 0.84   # px per satuan (pada resolusi akhir)
LW = 2.7           # tebal garis (px akhir)
INK, GREY, WHITE = 0, 165, 255
F_NONE, F_HATCH, F_GREY, F_BLACK = 0, 1, 2, 3
FILL_NAMA = {0: "putih (kosong)", 1: "arsir", 2: "abu-abu", 3: "hitam"}
LETTERS = "ABCDE"
CAT = {"analogi": "Figural – Analogi", "ganjil": "Figural – Ketidaksamaan", "serial": "Figural – Serial"}
FONT_PATHS = [r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\segoeuib.ttf", "DejaVuSans-Bold.ttf"]


def font(size):
    for f in FONT_PATHS:
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    return ImageFont.load_default()


# ----------------------------------------------------------------------------- geometri
def rot_cw(p, deg):
    """Putar titik (koordinat y ke atas) sebesar deg derajat SEARAH jarum jam."""
    a = math.radians(deg)
    x, y = p
    return (x * math.cos(a) + y * math.sin(a), -x * math.sin(a) + y * math.cos(a))


def reg_poly(n, r, c=(0.0, 0.0), rot=0.0):
    """Segi-n beraturan; ganjil: titik sudut di atas; genap: sisi bawah mendatar."""
    start = 90.0 if n % 2 else 90.0 + 180.0 / n
    return [(c[0] + r * math.cos(math.radians(start - rot + 360.0 * i / n)),
             c[1] + r * math.sin(math.radians(start - rot + 360.0 * i / n))) for i in range(n)]


def star_pts(r, c=(0.0, 0.0), k=5, inner=0.42):
    pts = []
    for i in range(2 * k):
        rr = r if i % 2 == 0 else r * inner
        a = math.radians(90 + 180.0 * i / k)
        pts.append((c[0] + rr * math.cos(a), c[1] + rr * math.sin(a)))
    return pts


def hatch_lines(spacing=0.17, ext=1.6):
    """Garis arsir miring (/) dalam koordinat lokal."""
    out, c = [], -2 * ext
    while c <= 2 * ext:
        out.append(((-ext, -ext + c), (ext, ext + c)))
        c += spacing
    return out


HATCH = hatch_lines()

# Bangun dasar bersudut-tak-simetris (kiral) untuk soal rotasi/pencerminan.
# primitif: ("P", pts, fillable) poligon; ("L", pts) polyline; ("C", (x,y), r, fillable) lingkaran;
#           ("PB", pts) poligon hitam pejal.
_MOTIF_RAW = {
    "bendera": [("L", [(0, -0.75), (0, 0.75)]), ("L", [(-0.3, -0.75), (0.3, -0.75)]),
                ("P", [(0, 0.75), (0.75, 0.48), (0, 0.2)], True)],
    "siku": [("P", [(0, 0), (0, 1.4), (0.38, 1.4), (0.38, 0.36), (0.92, 0.36), (0.92, 0)], True)],
    "kait": [("P", [(0, 0), (0, 1.4), (0.85, 1.4), (0.85, 0.72), (0.34, 0.72), (0.34, 0)], True)],
    "kunci": [("C", (0, 0.82), 0.34, True), ("L", [(0, 0.48), (0, -0.85)]),
              ("L", [(0, -0.85), (0.32, -0.85)]), ("L", [(0, -0.55), (0.24, -0.55)])],
    "sepatu": [("P", [(0, 0), (0, 1.3), (0.42, 1.3), (0.42, 0.48), (1.05, 0.3), (1.05, 0)], True)],
    "palu": [("L", [(0, -0.85), (0, 0.52)]),
             ("P", [(-0.42, 0.52), (0.18, 0.52), (0.7, 0.71), (0.18, 0.9), (-0.42, 0.9)], True)],
    "panah": [("L", [(0, -0.6), (0, 0.55), (0.7, 0.55)]), ("PB", [(0.95, 0.55), (0.66, 0.73), (0.66, 0.37)]),
              ("C", (0, -0.6), 0.12, True)],
    "segitiga": [("P", [(0, 0), (1.25, 0), (0, 0.72)], True), ("C", (0.95, 0.75), 0.11, False)],
}
MOTIF_NAMA = {"bendera": "bendera", "siku": "bangun siku", "kait": "bangun kait", "kunci": "kunci",
              "sepatu": "bangun sepatu", "palu": "palu", "panah": "panah siku",
              "segitiga": "segitiga siku-siku bertitik"}


def _normalize_motifs():
    out = {}
    for name, prims in _MOTIF_RAW.items():
        pts = []
        for pr in prims:
            if pr[0] == "C":
                (x, y), r = pr[1], pr[2]
                pts += [(x - r, y - r), (x + r, y + r)]
            else:
                pts += list(pr[1])
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
        rad = 0.0
        for pr in prims:
            if pr[0] == "C":
                rad = max(rad, math.hypot(pr[1][0] - cx, pr[1][1] - cy) + pr[2])
            else:
                rad = max(rad, max(math.hypot(x - cx, y - cy) for x, y in pr[1]))
        k = 0.8 / rad
        new = []
        for pr in prims:
            if pr[0] == "C":
                new.append(("C", ((pr[1][0] - cx) * k, (pr[1][1] - cy) * k), pr[2] * k, pr[3]))
            elif pr[0] == "P":
                new.append(("P", [((x - cx) * k, (y - cy) * k) for x, y in pr[1]], pr[2]))
            else:
                new.append((pr[0], [((x - cx) * k, (y - cy) * k) for x, y in pr[1]]))
        out[name] = new
    return out


MOTIF = _normalize_motifs()
MOTIF_FILLABLE = {n for n, prs in MOTIF.items() if any(p[0] in ("P", "C") and p[-1] is True for p in prs)}

SHAPE_SIDES = {"lingkaran": 0, "segitiga": 3, "persegi": 4, "segilima": 5, "segienam": 6, "segitujuh": 7,
               "segidelapan": 8, "belah ketupat": 4, "bintang": 10}
SIDES_NAMA = {0: "lingkaran", 3: "segitiga", 4: "segi empat", 5: "segi lima", 6: "segi enam", 7: "segi tujuh",
              8: "segi delapan"}


def shape_prims(name, r, fill):
    if name == "lingkaran":
        return [("circle", (0.0, 0.0), r, fill)]
    if name == "bintang":
        return [("poly", star_pts(r), fill)]
    if name == "belah ketupat":
        return [("poly", [(0, r), (r * 0.78, 0), (0, -r), (-r * 0.78, 0)], fill)]
    return [("poly", reg_poly(SHAPE_SIDES[name], r), fill)]


def dot_layout(n, sp=0.235):
    L = {0: [], 1: [(0, 0)], 2: [(-0.5, 0), (0.5, 0)], 3: [(-0.5, -0.4), (0.5, -0.4), (0, 0.45)],
         4: [(-0.5, -0.5), (0.5, -0.5), (-0.5, 0.5), (0.5, 0.5)],
         5: [(-0.7, -0.7), (0.7, -0.7), (0, 0), (-0.7, 0.7), (0.7, 0.7)],
         6: [(-0.5, -0.9), (0.5, -0.9), (-0.5, 0), (0.5, 0), (-0.5, 0.9), (0.5, 0.9)],
         7: [(-0.5, -0.9), (0.5, -0.9), (-1, 0), (0, 0), (1, 0), (-0.5, 0.9), (0.5, 0.9)],
         8: [(-0.9, -0.9), (0, -0.9), (0.9, -0.9), (-0.45, 0), (0.45, 0), (-0.9, 0.9), (0, 0.9), (0.9, 0.9)],
         9: [(x, y) for y in (-0.9, 0, 0.9) for x in (-0.9, 0, 0.9)]}[n]
    return [(x * sp, y * sp) for x, y in L]


# kisi 3x3 untuk bangun garis
LAT = [(i, j) for j in (-1, 0, 1) for i in (-1, 0, 1)]
SEGS = []
for _j in (-1, 0, 1):
    for _i in (-1, 0):
        SEGS.append(((_i, _j), (_i + 1, _j)))
for _i in (-1, 0, 1):
    for _j in (-1, 0):
        SEGS.append(((_i, _j), (_i, _j + 1)))
for _i in (-1, 0):
    for _j in (-1, 0):
        SEGS.append(((_i, _j), (_i + 1, _j + 1)))
        SEGS.append(((_i + 1, _j), (_i, _j + 1)))
SEGS = [tuple(sorted(s)) for s in SEGS]
SEG_ID = {s: k for k, s in enumerate(SEGS)}
LS = 0.72  # jarak kisi

PT_MAP = {
    ("rot", 90): lambda x, y: (y, -x), ("rot", 180): lambda x, y: (-x, -y), ("rot", 270): lambda x, y: (-y, x),
    ("mir", "v"): lambda x, y: (-x, y), ("mir", "h"): lambda x, y: (x, -y),
    ("mir", "d1"): lambda x, y: (y, x), ("mir", "d2"): lambda x, y: (-y, -x),
}


def map_segs(g, key):
    f = PT_MAP[key]
    return tuple(sorted(SEG_ID[tuple(sorted((f(*a), f(*b))))] for a, b in (SEGS[s] for s in g)))


GRID_RING = {8: [(0, 0), (0, 1), (0, 2), (1, 2), (2, 2), (2, 1), (2, 0), (1, 0)],
             4: [(0, 0), (0, 1), (1, 1), (1, 0)]}
TOKEN_NAMA = {"hitam": "lingkaran hitam", "putih": "lingkaran putih", "segitiga": "segitiga hitam",
              "bintang": "bintang", "silang": "tanda silang"}
CLOCK_HAND = ("jarum panah (panjang)", "jarum bertitik (pendek)")


# ----------------------------------------------------------------------------- state -> primitif
def prims_of(s):
    k = s["k"]
    out = []
    if k == "motif":
        sc = [0.6, 0.8, 1.0][s.get("sz", 2)]
        off = (0.0, 0.0)
        if s.get("n") is not None:
            sc *= 0.8
            off = (0.0, 0.14)

        def T(p):
            x, y = p
            if s["mir"]:
                x = -x
            x, y = rot_cw((x, y), s["rot"])
            return (x * sc + off[0], y * sc + off[1])

        hatch = [(T(a), T(b)) for a, b in HATCH]
        for pr in MOTIF[s["b"]]:
            if pr[0] == "P":
                out.append(("poly", [T(p) for p in pr[1]], s["fill"] if pr[2] else F_NONE, hatch))
            elif pr[0] == "PB":
                out.append(("poly", [T(p) for p in pr[1]], F_BLACK, None))
            elif pr[0] == "L":
                out.append(("pline", [T(p) for p in pr[1]], 1.0))
            elif pr[0] == "C":
                f = s["fill"] if pr[3] is True else (F_BLACK if pr[3] is False else F_NONE)
                out.append(("circle", T(pr[1]), pr[2] * sc, f, hatch))
        if s.get("n"):
            n = s["n"]
            for i in range(n):
                out.append(("dot", ((i - (n - 1) / 2) * 0.2, -0.86), 0.065))
    elif k == "poly":
        # faktor agar segi-n tampak seukuran lingkaran (jari-jari luar segi-n lebih besar)
        r = [0.52, 0.66, 0.8][s.get("sz", 2)] * {0: 1.0, 3: 1.1, 4: 1.12, 5: 1.05}.get(s["s"], 1.02)
        if s["s"] == 0:
            out.append(("circle", (0.0, 0.0), r, s["fill"], HATCH))
        else:
            out.append(("poly", reg_poly(s["s"], r), s["fill"], HATCH))
        for p in dot_layout(s.get("n", 0)):
            out.append(("dot", p, 0.075, s["fill"] == F_BLACK))   # titik putih di atas isian hitam
    elif k == "nest":
        ro = 0.84
        ri = 0.3 if s["o"] in ("bintang", "segitiga") else 0.38
        for pr in shape_prims(s["o"], ro, s["fo"]):
            out.append(pr + (HATCH,))
        for pr in shape_prims(s["i"], ri, s["fi"]):
            out.append(pr + (HATCH,))
    elif k == "grid":
        n = 3 if s["r"] == 8 else 2
        h = 0.9
        cell = 2 * h / n
        out.append(("poly", [(-h, -h), (h, -h), (h, h), (-h, h)], F_NONE, None))
        for i in range(1, n):
            out.append(("line", (-h + i * cell, -h), (-h + i * cell, h), 0.6))
            out.append(("line", (-h, -h + i * cell), (h, -h + i * cell), 0.6))
        tr = 0.17 if n == 3 else 0.26
        for typ, pos in s["t"]:
            row, col = GRID_RING[s["r"]][pos]
            c = (-h + (col + 0.5) * cell, h - (row + 0.5) * cell)
            out += token_prims(typ, c, tr)
    elif k == "clock":
        out.append(("circle", (0.0, 0.0), 0.88, F_NONE, None))
        for d in range(8):
            a = d * 45
            out.append(("line", rot_cw((0, 0.88), a), rot_cw((0, 0.76), a), 0.8))
        tip = rot_cw((0, 0.68), s["h"][0] * 45)
        out.append(("line", (0, 0), rot_cw((0, 0.5), s["h"][0] * 45), 1.15))
        out.append(("poly", [tip, rot_cw((-0.13, 0.46), s["h"][0] * 45), rot_cw((0.13, 0.46), s["h"][0] * 45)],
                    F_BLACK, None))
        e = rot_cw((0, 0.42), s["h"][1] * 45)
        out.append(("line", (0, 0), e, 1.15))
        out.append(("circle", e, 0.09, F_BLACK, None))
        out.append(("circle", (0, 0), 0.06, F_BLACK, None))
    elif k == "lines":
        for sid in s["g"]:
            a, b = SEGS[sid]
            out.append(("line", (a[0] * LS, a[1] * LS), (b[0] * LS, b[1] * LS), 1.1))
    elif k == "bw":
        # lingkaran kecil hitam/putih pada kisi 3x3 (posisi 0..8), nilai 1=hitam 0=putih
        for pos, col in s["c"]:
            c = ((pos % 3 - 1) * 0.55, (1 - pos // 3) * 0.55)
            out.append(("circle", c, 0.19, F_BLACK if col else F_NONE, None))
    return out


def token_prims(typ, c, r):
    if typ == "hitam":
        return [("circle", c, r, F_BLACK, None)]
    if typ == "putih":
        return [("circle", c, r, F_NONE, None)]
    if typ == "segitiga":
        return [("poly", reg_poly(3, r * 1.15, c), F_BLACK, None)]
    if typ == "bintang":
        return [("poly", star_pts(r * 1.2, c), F_BLACK, None)]
    if typ == "silang":
        d = r * 0.8
        return [("line", (c[0] - d, c[1] - d), (c[0] + d, c[1] + d), 1.2),
                ("line", (c[0] - d, c[1] + d), (c[0] + d, c[1] - d), 1.2)]
    raise ValueError(typ)


# ----------------------------------------------------------------------------- render
_CACHE = {}


def skey(s):
    return json.dumps(s, sort_keys=True)


def render(s, size=P):
    """State -> array uint8 (size x size), latar putih."""
    key = (skey(s), size)
    if key in _CACHE:
        return _CACHE[key]
    S = size * SS
    u = size / 2 * 0.84 * SS
    img = Image.new("L", (S, S), WHITE)
    dr = ImageDraw.Draw(img)
    lw = LW * SS * size / P

    def px(p):
        return (S / 2 + p[0] * u, S / 2 - p[1] * u)

    def stroke(pts, w, closed=False):
        q = [px(p) for p in pts]
        if closed:
            q = q + [q[0]]
        width = max(2, 2 * int(round(lw * w / 2)))   # genap -> garis simetris terhadap sumbu
        dr.line(q, fill=INK, width=width, joint="curve")
        rr = width / 2
        for x, y in (q if not closed else q[:-1]):
            dr.ellipse((x - rr, y - rr, x + rr, y + rr), fill=INK)

    def area(kind, geo, fill, hatch):
        if kind == "poly":
            shape = [px(p) for p in geo]
            drawf = lambda d, v: d.polygon(shape, fill=v)
        else:
            (cx, cy), r = px(geo[0]), geo[1] * u
            drawf = lambda d, v: d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=v)
        if fill == F_BLACK:
            drawf(dr, INK)
        elif fill == F_GREY:
            drawf(dr, GREY)
        else:
            drawf(dr, WHITE)
            if fill == F_HATCH:
                mask = Image.new("L", (S, S), 0)
                drawf(ImageDraw.Draw(mask), 255)
                layer = Image.new("L", (S, S), WHITE)
                ld = ImageDraw.Draw(layer)
                for a, b in hatch:
                    ld.line([px(a), px(b)], fill=INK, width=max(1, int(round(lw * 0.5))))
                img.paste(layer, (0, 0), mask)

    for pr in prims_of(s):
        t = pr[0]
        if t == "poly":
            area("poly", pr[1], pr[2], pr[3] if len(pr) > 3 else None)
            stroke(pr[1], 1.0, closed=True)
        elif t == "circle":
            area("circle", (pr[1], pr[2]), pr[3], pr[4] if len(pr) > 4 else None)
            (cx, cy), r = px(pr[1]), pr[2] * u
            dr.ellipse((cx - r, cy - r, cx + r, cy + r), outline=INK, width=max(1, int(round(lw))))
        elif t == "line":
            stroke([pr[1], pr[2]], pr[3])
        elif t == "pline":
            stroke(pr[1], pr[2])
        elif t == "dot":
            (cx, cy), r = px(pr[1]), pr[2] * u
            if len(pr) > 3 and pr[3]:
                dr.ellipse((cx - r, cy - r, cx + r, cy + r), fill=WHITE)
            else:
                h = r + lw * 0.6
                dr.ellipse((cx - h, cy - h, cx + h, cy + h), fill=WHITE)
                dr.ellipse((cx - r, cy - r, cx + r, cy + r), fill=INK)
    arr = np.asarray(img.reduce(SS), dtype=np.uint8)
    _CACHE[key] = arr
    return arr


def vdiff(a, b):
    """Jumlah piksel yang berbeda nyata (selisih > 64 tingkat keabuan)."""
    return int(np.count_nonzero(np.abs(a.astype(np.int16) - b.astype(np.int16)) > 64))


def dilate(m):
    out = m.copy()
    out[1:, :] |= m[:-1, :]
    out[:-1, :] |= m[1:, :]
    o2 = out.copy()
    o2[:, 1:] |= out[:, :-1]
    o2[:, :-1] |= out[:, 1:]
    return o2


def hdiff(a, b):
    """Selisih bertoleransi 1 px (abaikan pergeseran sub-piksel rasterisasi): piksel tinta yang tidak punya
    pasangan dalam jarak 1 px pada gambar lain."""
    ia, ib = a < 160, b < 160
    return int(np.count_nonzero(ia & ~dilate(ib)) + np.count_nonzero(ib & ~dilate(ia)))


SAME_TOL = 6       # <= ini dianggap gambar sama
DISTINCT_MIN = 100  # >= ini dianggap jelas berbeda (panel 150 px)


# ----------------------------------------------------------------------------- aturan (operasi pada state)
AX = ("v", "h", "d1", "d2")
AX_C = {"v": 0, "h": 180, "d1": 90, "d2": 270}           # Ref = R_cw(c) o F_x
CLOCK_MIR = {"v": 0, "h": 4, "d1": 2, "d2": 6}           # d -> (c - d) % 8
INV = {0: 3, 3: 0, 1: 1, 2: 2}


def grid_cell_map(r, ax):
    n = 3 if r == 8 else 2
    f = {"v": lambda a, b: (a, n - 1 - b), "h": lambda a, b: (n - 1 - a, b),
         "d1": lambda a, b: (n - 1 - b, n - 1 - a), "d2": lambda a, b: (b, a)}[ax]
    ring = GRID_RING[r]
    return [ring.index(f(*ring[p])) for p in range(r)]


def seg_union(a, b):
    return sorted(set(a) | set(b))


def seg_xor(a, b):
    return sorted(set(a) ^ set(b))


def seg_inter(a, b):
    return sorted(set(a) & set(b))


def apply(s, op):
    """Terapkan satu operasi; None bila tidak berlaku."""
    if s is None:
        return None
    t, k = op[0], s["k"]
    if t == "seq":
        x = s
        for o in op[1:]:
            x = apply(x, o)
            if x is None:
                return None
        return x
    n = dict(s)
    if t == "rot":
        d = op[1] % 360
        if k == "motif":
            n["rot"] = (s["rot"] + d) % 360
        elif k == "lines":
            if d % 90:
                return None
            n["g"] = list(map_segs(s["g"], ("rot", d))) if d else list(s["g"])
        elif k == "clock":
            n["h"] = [(h + d // 45) % 8 for h in s["h"]]
        elif k == "grid":
            if d % 90:
                return None
            step = (d // 90) * (2 if s["r"] == 8 else 1)
            n["t"] = [[ty, (p + step) % s["r"]] for ty, p in s["t"]]
        else:
            return None
    elif t == "mir":
        ax = op[1]
        if k == "motif":
            n["mir"] = 1 - s["mir"]
            n["rot"] = (AX_C[ax] - s["rot"]) % 360
        elif k == "lines":
            n["g"] = list(map_segs(s["g"], ("mir", ax)))
        elif k == "clock":
            n["h"] = [(CLOCK_MIR[ax] - h) % 8 for h in s["h"]]
        elif k == "grid":
            m = grid_cell_map(s["r"], ax)
            n["t"] = [[ty, m[p]] for ty, p in s["t"]]
        else:
            return None
    elif t == "cnt":
        if k not in ("motif", "poly") or s.get("n") is None:
            return None
        v = s["n"] + op[1]
        if v < 0 or v > (8 if k == "motif" else 9):
            return None
        n["n"] = v
    elif t == "sides":
        if k != "poly" or s["s"] == 0:
            return None
        v = s["s"] + op[1]
        if v < 3 or v > 8:
            return None
        n["s"] = v
    elif t in ("fillc", "fillm", "fillt", "inv"):
        if k not in ("motif", "poly", "nest"):
            return None
        if k == "nest":
            if t != "inv":
                return None
            n["fo"], n["fi"] = INV[s["fo"]], INV[s["fi"]]
        elif t == "fillc":
            n["fill"] = (s["fill"] + op[1]) % 4
        elif t == "fillm":
            if s["fill"] != op[1]:
                return None
            n["fill"] = op[2]
        elif t == "fillt":
            if s["fill"] == op[1]:
                n["fill"] = op[2]
            elif s["fill"] == op[2]:
                n["fill"] = op[1]
            else:
                return None
        else:
            n["fill"] = INV[s["fill"]]
    elif t in ("size", "sizec"):
        if k not in ("motif", "poly"):
            return None
        v = s.get("sz", 2) + op[1]
        if t == "sizec":
            v %= 3
        if v < 0 or v > 2:
            return None
        n["sz"] = v
    elif t == "move":
        if k != "grid" or op[1] >= len(s["t"]):
            return None
        n["t"] = [[ty, (p + op[2]) % s["r"]] if i == op[1] else [ty, p] for i, (ty, p) in enumerate(s["t"])]
    elif t == "hand":
        if k != "clock":
            return None
        n["h"] = [(h + op[2]) % 8 if i == op[1] else h for i, h in enumerate(s["h"])]
    elif t == "swap":
        if k != "nest":
            return None
        n["o"], n["i"] = s["i"], s["o"]
    elif t == "swapfill":
        if k != "nest":
            return None
        n["fo"], n["fi"] = s["fi"], s["fo"]
    elif t in ("mapo", "mapi", "mapfo", "mapfi"):
        if k != "nest":
            return None
        f = {"mapo": "o", "mapi": "i", "mapfo": "fo", "mapfi": "fi"}[t]
        if s[f] != op[1]:
            return None
        n[f] = op[2]
    elif t == "mirunion":
        if k != "lines":
            return None
        n["g"] = seg_union(s["g"], map_segs(s["g"], ("mir", op[1])))
    else:
        raise ValueError(op)
    return n


def singles(s):
    """Pustaka aturan tunggal yang masuk akal untuk jenis state ini (untuk pemecah)."""
    k, L = s["k"], []
    if k == "motif":
        L += [("rot", d) for d in range(45, 360, 45)] + [("mir", a) for a in AX]
        L += [("size", d) for d in (-2, -1, 1, 2)] + [("sizec", 1), ("sizec", 2)]
        L += [("fillc", d) for d in (1, 2, 3)] + [("inv",)]
        L += [("fillm", a, b) for a in range(4) for b in range(4) if a != b]
        L += [("fillt", a, b) for a in range(4) for b in range(4) if a < b]
        if s.get("n") is not None:
            L += [("cnt", d) for d in (-3, -2, -1, 1, 2, 3)]
    elif k == "poly":
        L += [("cnt", d) for d in (-3, -2, -1, 1, 2, 3)] + [("sides", d) for d in (-2, -1, 1, 2)]
        L += [("size", d) for d in (-2, -1, 1, 2)] + [("sizec", 1), ("sizec", 2)]
        L += [("fillc", d) for d in (1, 2, 3)] + [("inv",)]
        L += [("fillm", a, b) for a in range(4) for b in range(4) if a != b]
        L += [("fillt", a, b) for a in range(4) for b in range(4) if a < b]
    elif k == "nest":
        L += [("swap",), ("swapfill",), ("inv",)]
        L += [("mapo", a, b) for a in SHAPE_SIDES for b in SHAPE_SIDES if a != b]
        L += [("mapi", a, b) for a in SHAPE_SIDES for b in SHAPE_SIDES if a != b]
        L += [("mapfo", a, b) for a in range(4) for b in range(4) if a != b]
        L += [("mapfi", a, b) for a in range(4) for b in range(4) if a != b]
    elif k == "grid":
        L += [("move", i, d) for i in range(len(s["t"])) for d in range(1, s["r"])]
        L += [("rot", d) for d in (90, 180, 270)] + [("mir", a) for a in AX]
    elif k == "clock":
        L += [("hand", i, d) for i in range(2) for d in range(1, 8)]
        L += [("rot", d) for d in range(45, 360, 45)] + [("mir", a) for a in AX]
    elif k == "lines":
        L += [("rot", d) for d in (90, 180, 270)] + [("mir", a) for a in AX] + [("mirunion", a) for a in AX]
    return L


def pairs(L):
    return [("seq", a, b) for a in L for b in L if a != b]


def same_vis(a, b):
    return vdiff(render(a), render(b)) <= SAME_TOL


def unique_pred(preds):
    """preds: {skey: (state, alasan)} -> True bila semua prediksi sama secara visual."""
    sts = [v[0] for v in preds.values()]
    return all(same_vis(sts[0], x) for x in sts[1:])


def _fits(st, op_for, keys):
    return all(skey(apply(st[i], op_for(i)) or {}) == keys[i + 1] for i in range(len(st) - 1))


def solve_analogy(A, B, C):
    LA = singles(A)
    for level, cands in ((1, LA), (2, pairs(LA))):
        preds, kb = {}, skey(B)
        for op in cands:
            b = apply(A, op)
            if b is None or skey(b) != kb:
                continue
            c = apply(C, op)
            if c is not None:
                preds.setdefault(skey(c), (c, op))
        if preds:
            return level, preds
    return None, {}


def solve_serial(st):
    """Tingkat 1: satu aturan; 2: dua aturan serentak / selang-seling; 3: gabungan garis / dua deret."""
    n = len(st)
    keys = [skey(x) for x in st]
    same_kind = len({x["k"] for x in st}) == 1
    if same_kind:
        L = singles(st[0])
        preds = {}
        for op in L:
            if _fits(st, lambda i: op, keys):
                c = apply(st[-1], op)
                if c is not None:
                    preds.setdefault(skey(c), (c, op))
        if preds:
            return 1, preds
        for op in pairs(L):
            if _fits(st, lambda i: op, keys):
                c = apply(st[-1], op)
                if c is not None:
                    preds.setdefault(skey(c), (c, op))
        for a in L:
            for b in L:
                if a != b and _fits(st, lambda i: a if i % 2 == 0 else b, keys):
                    c = apply(st[-1], a if (n - 1) % 2 == 0 else b)
                    if c is not None:
                        preds.setdefault(skey(c), (c, ("alt", a, b)))
        if preds:
            return 2, preds
    preds = {}
    if n == 5 and same_kind and st[0]["k"] == "lines":
        for name, f in (("xor", seg_xor), ("union", seg_union), ("inter", seg_inter)):
            if f(st[0]["g"], st[1]["g"]) == sorted(st[2]["g"]):
                c = dict(st[3], g=f(st[3]["g"], st[4]["g"]))
                preds.setdefault(skey(c), (c, (name,)))
    if n == 5:   # dua deret berselang (posisi ganjil & genap)
        ev, od = st[0::2], st[1::2]
        if len({x["k"] for x in ev}) == 1 and len({x["k"] for x in od}) == 1:
            Le = singles(ev[0])
            ok_e = [op for op in Le + pairs(Le) if _fits(ev, lambda i: op, [skey(x) for x in ev])]
            if ok_e:
                Lo = singles(od[0])
                for lv in (Lo, pairs(Lo)):
                    got = {}
                    for op in lv:
                        if skey(apply(od[0], op) or {}) == skey(od[1]):
                            c = apply(od[1], op)
                            if c is not None:
                                got.setdefault(skey(c), (c, ("dua-deret", op)))
                    if got:
                        preds.update(got)
                        break
    if preds:
        return 3, preds
    return None, {}


# ----------------------------------------------------------------------------- fitur untuk ketidaksamaan
def ink_of(arr):
    return arr < 200


def sym_axes(arr):
    """Sumbu simetri dari bitmap (toleransi 1 px untuk pergeseran rasterisasi)."""
    ink = ink_of(arr)
    di = dilate(ink)
    tol = max(10, int(0.01 * int(ink.sum())))

    def same(m):
        return int(np.count_nonzero(ink & ~dilate(m)) + np.count_nonzero(m & ~di)) <= tol
    out = [name for name, m in (("v", np.fliplr(ink)), ("h", np.flipud(ink)), ("d2", ink.T),
                                ("d1", ink[::-1, ::-1].T)) if same(np.ascontiguousarray(m))]
    return out, same(np.ascontiguousarray(np.rot90(ink, 2)))


def components(mask, conn4=True):
    """Label komponen (BFS) -> list of (ukuran, menyentuh_tepi)."""
    h, w = mask.shape
    nb = ((1, 0), (-1, 0), (0, 1), (0, -1)) if conn4 else \
        ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1))
    m = mask.tolist()
    sn = [[False] * w for _ in range(h)]
    out = []
    for y in range(h):
        for x in range(w):
            if m[y][x] and not sn[y][x]:
                q = deque([(y, x)])
                sn[y][x] = True
                size, border = 0, False
                while q:
                    cy, cx = q.popleft()
                    size += 1
                    if cy in (0, h - 1) or cx in (0, w - 1):
                        border = True
                    for dy, dx in nb:
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and m[ny][nx] and not sn[ny][nx]:
                            sn[ny][nx] = True
                            q.append((ny, nx))
                out.append((size, border))
    return out


def bitmap_regions(arr):
    """Jumlah daerah tertutup (komponen putih yang tidak menyentuh tepi)."""
    return sum(1 for size, border in components(arr >= 128) if not border and size >= 12)


def bitmap_pieces(arr):
    return sum(1 for size, _ in components(arr < 128, conn4=False) if size >= 6)


def lines_faces(g):
    """(daerah tertutup, komponen) secara kombinatorik: F = E - V + C (titik potong diagonal dihitung)."""
    g = set(g)
    V, E, par = set(), 0, {}

    def find(a):
        par.setdefault(a, a)
        while par[a] != a:
            a = par[a]
        return a

    def link(a, b):
        par[find(a)] = find(b)

    split = set()
    for s in g:
        a, b = SEGS[s]
        if abs(a[0] - b[0]) == 1 and abs(a[1] - b[1]) == 1:
            other = tuple(sorted(((a[0], b[1]), (b[0], a[1]))))
            if SEG_ID[other] in g:
                split.add(s)
    for s in g:
        a, b = SEGS[s]
        if s in split:
            m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
            V |= {a, b, m}
            E += 2
            link(a, m)
            link(m, b)
        else:
            V |= {a, b}
            E += 1
            link(a, b)
    C = len({find(v) for v in V})
    return E - len(V) + C, C


def features(s):
    arr = render(s)
    k = s["k"]
    axes, rsym = sym_axes(arr)
    f = {"jenis": k, "simetri-lipat": bool(axes), "simetri-putar": rsym}
    if k == "motif":
        f.update(bangun=s["b"], kiral=s["mir"], rot=s["rot"], isian=s["fill"], ukuran=s.get("sz", 2),
                 titik=s.get("n"))
    elif k == "poly":
        f.update(sisi=s["s"], isian=s["fill"], titik=s["n"], paritas=s["n"] % 2, selisih=s["n"] - s["s"],
                 titik_eq_sisi=s["n"] == s["s"], ukuran=s.get("sz", 2), ber_isi=s["fill"] != F_NONE)
    elif k == "nest":
        so, si = SHAPE_SIDES[s["o"]], SHAPE_SIDES[s["i"]]
        f.update(luar=s["o"], dalam=s["i"], isi_luar=s["fo"], isi_dalam=s["fi"], sama=s["o"] == s["i"],
                 relasi=si - so, isi_sama=s["fo"] == s["fi"])
    elif k == "grid":
        f.update(token=tuple(t for t, _ in s["t"]), posisi=tuple(p for _, p in s["t"]))
        if len(s["t"]) == 2:
            f.update(jarak=(s["t"][1][1] - s["t"][0][1]) % s["r"])
    elif k == "clock":
        d = abs(s["h"][0] - s["h"][1]) % 8
        f.update(sudut=min(d, 8 - d), arah=(s["h"][1] - s["h"][0]) % 8, j0=s["h"][0], j1=s["h"][1])
    elif k == "lines":
        f.update(garis=len(s["g"]), daerah=bitmap_regions(arr), potongan=bitmap_pieces(arr))
    elif k == "bw":
        nb = sum(c for _, c in s["c"])
        nw = len(s["c"]) - nb
        f.update(hitam=nb, putih=nw, selisih=nb - nw, seimbang=nb == nw, total=len(s["c"]))
    return f


def outlier(vals):
    """Indeks satu-satunya nilai yang berbeda bila tepat 4 nilai sama; selain itu None."""
    for i in range(5):
        rest = [vals[j] for j in range(5) if j != i]
        if all(r == rest[0] for r in rest) and vals[i] != rest[0]:
            return i
    return None


# ----------------------------------------------------------------------------- konstruktor state
def M(b, rot=0, mir=0, fill=0, n=None, sz=2):
    s = {"k": "motif", "b": b, "rot": rot % 360, "mir": mir, "fill": fill, "sz": sz}
    if n is not None:
        s["n"] = n
    return s


def PL(sides, fill=0, n=0, sz=2):
    return {"k": "poly", "s": sides, "fill": fill, "n": n, "sz": sz}


def NS(o, i, fo, fi):
    return {"k": "nest", "o": o, "i": i, "fo": fo, "fi": fi}


def GR(r, toks):
    return {"k": "grid", "r": r, "t": [[t, p] for t, p in toks]}


def CK(h0, h1):
    return {"k": "clock", "h": [h0 % 8, h1 % 8]}


def LN(g):
    return {"k": "lines", "g": sorted(set(g))}


def BW(c):
    return {"k": "bw", "c": sorted([list(x) for x in c])}


# ----------------------------------------------------------------------------- teks
POS_NAMA = {8: ["pojok kiri atas", "kotak tengah atas", "pojok kanan atas", "kotak tengah kanan",
                "pojok kanan bawah", "kotak tengah bawah", "pojok kiri bawah", "kotak tengah kiri"],
            4: ["kotak kiri atas", "kotak kanan atas", "kotak kanan bawah", "kotak kiri bawah"]}
DIR_NAMA = ["atas", "kanan atas", "kanan", "kanan bawah", "bawah", "kiri bawah", "kiri", "kiri atas"]
UKURAN = ["kecil", "sedang", "besar"]
SUMBU = {"v": "garis tegak (kiri dan kanan tertukar)", "h": "garis mendatar (atas dan bawah tertukar)",
         "d1": "garis diagonal", "d2": "garis diagonal"}


def arah(d):
    d %= 360
    if d == 180:
        return "180°"
    return f"{d}° searah jarum jam" if d < 180 else f"{360 - d}° berlawanan arah jarum jam"


def fill_order_text(k):
    seq = [0, 1, 2, 3] if k % 4 == 1 else [3, 2, 1, 0]
    names = [FILL_NAMA[x].split(" ")[0] for x in seq]
    return " → ".join(names) + " → " + names[0] + " (berulang)"


def tok_name(s, i):
    return TOKEN_NAMA[s["t"][i][0]]


def desc(op, s):
    """Uraian aturan (klausa lengkap)."""
    t = op[0]
    if t == "rot":
        if s["k"] == "clock":
            return f"kedua jarum berputar {arah(op[1])}"
        if s["k"] == "grid":
            return f"seluruh isi kotak berputar {arah(op[1])}"
        return f"{'susunan garis' if s['k'] == 'lines' else 'bangun'} diputar {arah(op[1])}"
    if t == "mir":
        return f"{'susunan garis' if s['k'] == 'lines' else 'bangun'} dicerminkan terhadap {SUMBU[op[1]]}"
    if t == "cnt":
        return f"jumlah titik {'bertambah' if op[1] > 0 else 'berkurang'} {abs(op[1])}"
    if t == "sides":
        return f"jumlah sisi bangun {'bertambah' if op[1] > 0 else 'berkurang'} {abs(op[1])}"
    if t == "fillm":
        return f"isian bangun berubah dari {FILL_NAMA[op[1]]} menjadi {FILL_NAMA[op[2]]}"
    if t == "fillt":
        return f"isian bangun berganti-ganti {FILL_NAMA[op[1]]} dan {FILL_NAMA[op[2]]}"
    if t == "fillc":
        return f"isian bangun berganti berurutan {fill_order_text(op[1])}"
    if t == "size":
        return "ukuran bangun " + ("mengecil" if op[1] < 0 else "membesar") + \
            f" dari {UKURAN[s.get('sz', 2)]} menjadi {UKURAN[s.get('sz', 2) + op[1]]}"
    if t == "sizec":
        return "ukuran bangun " + ("mengecil bertahap besar → sedang → kecil, lalu kembali besar" if op[1] == 2
                                   else "membesar bertahap kecil → sedang → besar, lalu kembali kecil")
    if t == "move":
        unit = "kotak di sepanjang tepi" if s["r"] == 8 else "kotak"
        return f"{tok_name(s, op[1])} berpindah {abs(op[2])} {unit} " + \
            ("searah" if op[2] > 0 else "berlawanan arah") + " jarum jam"
    if t == "hand":
        return f"{CLOCK_HAND[op[1]]} berputar {abs(op[2]) * 45}° " + \
            ("searah" if op[2] > 0 else "berlawanan arah") + " jarum jam"
    if t == "swap":
        return "bangun luar dan bangun dalam bertukar posisi (isian tetap mengikuti posisinya)"
    if t == "swapfill":
        return "isian bangun luar dan bangun dalam saling bertukar"
    if t == "inv":
        return "warnanya dibalik (hitam menjadi putih, putih menjadi hitam)"
    if t == "mirunion":
        return f"susunan garis digabung dengan bayangan cerminnya terhadap {SUMBU[op[1]].split(' (')[0]} " \
               "sehingga gambar menjadi simetris"
    raise ValueError(op)


def short(op):
    return {"rot": "putaran", "mir": "pencerminan", "cnt": "perubahan jumlah titik", "sides": "perubahan jumlah sisi",
            "fillm": "perubahan isian", "fillt": "pergantian isian", "fillc": "pergantian isian",
            "size": "perubahan ukuran", "sizec": "perubahan ukuran", "move": "perpindahan",
            "hand": "putaran jarum", "swap": "pertukaran posisi bangun", "swapfill": "pertukaran isian",
            "inv": "pembalikan warna", "mirunion": "penggabungan dengan bayangan cermin"}[op[0]]


def result(op, after):
    """Keadaan konkret hasil satu aturan."""
    t = op[0]
    if t == "rot":
        return f"diputar {arah(op[1])}"
    if t == "mir":
        return f"dicerminkan terhadap {SUMBU[op[1]].split(' (')[0]}"
    if t == "cnt":
        return f"titiknya menjadi {after['n']}"
    if t == "sides":
        return f"bangunnya menjadi {SIDES_NAMA[after['s']]}"
    if t in ("fillm", "fillt", "fillc"):
        return f"isiannya {FILL_NAMA[after['fill']]}"
    if t in ("size", "sizec"):
        return f"ukurannya {UKURAN[after['sz']]}"
    if t == "move":
        ty, p = after["t"][op[1]]
        return f"{TOKEN_NAMA[ty]} berada di {POS_NAMA[after['r']][p]}"
    if t == "hand":
        return f"{CLOCK_HAND[op[1]].split(' (')[0]} menunjuk ke arah {DIR_NAMA[after['h'][op[1]]]}"
    if t == "swap":
        return f"{after['o']} menjadi bangun luar dan {after['i']} menjadi bangun dalam"
    if t in ("swapfill", "inv"):
        return f"bangun luar berisian {FILL_NAMA[after['fo']]} dan bangun dalam berisian {FILL_NAMA[after['fi']]}"
    if t == "mirunion":
        return "gambarnya menjadi simetris"
    raise ValueError(op)


def join_id(parts):
    parts = [p for p in parts if p]
    if len(parts) <= 1:
        return "".join(parts)
    return ", ".join(parts[:-1]) + " dan " + parts[-1]


def cap(s):
    return s[:1].upper() + s[1:]


def comps(op):
    return list(op[1:]) if op[0] == "seq" else [op]


def compose_ops(ops):
    return ops[0] if len(ops) == 1 else ("seq",) + tuple(ops)


# ----------------------------------------------------------------------------- variasi salah (pengecoh)
def variants(op):
    """Versi aturan yang salah secara spesifik: list of (op_salah, catatan)."""
    t = op[0]
    out = []
    if t == "rot":
        d = op[1] % 360
        if d != 180:
            out.append((("rot", -d), f"diputar {arah(-d)}, arah putarnya terbalik"))
        else:
            out.append((("rot", 90), "hanya diputar 90°, bukan 180°"))
        step = 45 if d % 90 else 90
        for dd in (d + step, d - step):
            if dd % 360 not in (0, d, (-d) % 360):
                out.append((("rot", dd), f"diputar {arah(dd)}, besar sudutnya salah"))
        out.append((("mir", "v"), "dicerminkan, bukan diputar"))
    elif t == "mir":
        other = {"v": "h", "h": "v", "d1": "d2", "d2": "d1"}[op[1]]
        out.append((("mir", other), f"dicerminkan terhadap {SUMBU[other].split(' (')[0]}, sumbunya salah"))
        out.append((("rot", 180), "diputar 180°, bukan dicerminkan"))
        out.append((("rot", 90), "diputar 90°, bukan dicerminkan"))
    elif t == "cnt":
        k = op[1]
        for kk in (k + 1, k - 1, -k, k + 2):
            if kk != k:
                out.append((("cnt", kk), None))
    elif t == "sides":
        k = op[1]
        for kk in (k + 1, k - 1, -k):
            if kk != k:
                out.append((("sides", kk), None))
    elif t == "fillm":
        for c in range(4):
            if c not in (op[1], op[2]):
                out.append((("fillm", op[1], c), f"isiannya {FILL_NAMA[c]}, seharusnya {FILL_NAMA[op[2]]}"))
    elif t == "fillt":
        for c in range(4):
            if c not in (op[1], op[2]):
                out.append((("fillt", op[1], c), f"isiannya {FILL_NAMA[c]}, tidak mengikuti pola"))
    elif t == "fillc":
        for kk in (op[1] + 1, op[1] + 2):
            out.append((("fillc", kk % 4), "urutan isiannya tidak sesuai pola"))
    elif t == "size":
        for kk in (op[1] // 2 if abs(op[1]) == 2 else op[1] * 2, -op[1]):
            if kk:
                out.append((("size", kk), "ukurannya tidak sesuai pola"))
    elif t == "sizec":
        out.append((("sizec", 3 - op[1]), "urutan perubahan ukurannya terbalik"))
    elif t == "move":
        i, s_ = op[1], op[2]
        seen = {s_}
        for ss in (-s_, s_ + 1, s_ - 1, 2 * s_, s_ + 2, s_ - 2):
            if ss and ss not in seen:
                seen.add(ss)
                out.append((("move", i, ss), None))
    elif t == "hand":
        i, d = op[1], op[2]
        for dd in (-d, d + 1, d - 1):
            if dd and dd != d:
                out.append((("hand", i, dd), None))
    elif t == "swapfill":
        out.append((("swap",), "yang ditukar bentuk bangunnya, bukan isiannya"))
    elif t == "swap":
        out.append((("swapfill",), "yang ditukar isiannya, bukan bentuk bangunnya"))
    elif t == "inv":
        out.append((("swapfill",), "isiannya ditukar, bukan dibalik warnanya"))
    elif t == "mirunion":
        other = {"v": "h", "h": "v", "d1": "d2", "d2": "d1"}[op[1]]
        out.append((("mirunion", other), "digabung dengan bayangan cermin terhadap sumbu yang salah"))
        out.append((("mir", op[1]), "hanya dicerminkan, tidak digabung dengan gambar asalnya"))
    return out


def auto_note(wrong, right, before, s_wrong, s_right):
    """Catatan otomatis untuk variasi tanpa catatan tetap."""
    t = wrong[0]
    if t == "cnt":
        return f"titiknya {s_wrong['n']}, seharusnya {s_right['n']}"
    if t == "sides":
        return f"berupa {SIDES_NAMA[s_wrong['s']]}, seharusnya {SIDES_NAMA[s_right['s']]}"
    if t == "move":
        ty, p = s_wrong["t"][wrong[1]]
        return f"{TOKEN_NAMA[ty]} berada di {POS_NAMA[s_wrong['r']][p]}, langkah perpindahannya salah"
    if t == "hand":
        return f"{CLOCK_HAND[wrong[1]].split(' (')[0]} menunjuk ke {DIR_NAMA[s_wrong['h'][wrong[1]]]}, " \
               f"seharusnya ke {DIR_NAMA[s_right['h'][wrong[1]]]}"
    return "tidak sesuai aturan"


def omit_note(op, X):
    t = op[0]
    if t == "move":
        return f"{tok_name(X, op[1])} tidak berpindah, padahal seharusnya ikut berpindah"
    if t == "hand":
        return f"{CLOCK_HAND[op[1]].split(' (')[0]} tidak berputar, padahal seharusnya ikut berputar"
    if t == "rot":
        return "bangun tidak diputar"
    if t == "mir":
        return "bangun tidak dicerminkan"
    if t == "cnt":
        return "jumlah titik tidak berubah"
    if t == "sides":
        return "jumlah sisi tidak berubah"
    if t in ("fillm", "fillt", "fillc", "inv"):
        return "isian/warna tidak berubah"
    if t in ("size", "sizec"):
        return "ukurannya tidak berubah"
    return f"{short(op)} tidak diterapkan"


def has_collision(s):
    """Dua token di kotak yang sama, atau dua jarum jam saling menutupi."""
    if s["k"] == "clock":
        return s["h"][0] == s["h"][1]
    if s["k"] != "grid":
        return False
    ps = [p for _, p in s["t"]]
    return len(set(ps)) != len(ps)


def pick_distractors(correct, cands, extra_avoid=(), need=4):
    """Pilih 4 pengecoh yang sah, saling berbeda dan berbeda dari kunci (bitmap)."""
    chosen = []
    pool = [correct] + list(extra_avoid)
    for st, note in cands:
        if st is None or has_collision(st):
            continue
        r = render(st)
        if vdiff(r, render(correct)) < DISTINCT_MIN:
            continue
        if any(vdiff(r, render(c)) < DISTINCT_MIN for c, _ in chosen):
            continue
        chosen.append((st, note))
        if len(chosen) == need:
            break
    return chosen if len(chosen) == need else None


def generic_cands(X, ops, unchanged_note, prev=None):
    """Calon pengecoh dari aturan (list op komponen) yang diterapkan pada X."""
    full = compose_ops(ops)
    correct = apply(X, full)
    tiers = [[], [], [], []]
    for j, op in enumerate(ops):
        for r, (w, note) in enumerate(variants(op)):
            new_ops = ops[:j] + [w] + ops[j + 1:]
            st = apply(X, compose_ops(new_ops))
            if st is None:
                continue
            if note is None:
                note = auto_note(w, op, X, st, correct)
            tiers[0 if r == 0 else 2].append((st, note))
        if len(ops) > 1:
            rest = ops[:j] + ops[j + 1:]
            tiers[1].append((apply(X, compose_ops(rest)), omit_note(op, X)))
    if X["k"] == "motif" and correct is not None:
        mc = apply(correct, ("mir", "v"))
        if not same_vis(mc, X):
            tiers[1].append((mc, "merupakan bayangan cermin dari jawaban yang benar"))
    kinds = {o[0] for o in ops}
    if correct is not None and X["k"] in ("motif", "poly") and not kinds & {"fillm", "fillt", "fillc", "inv"}:
        tiers[2].append((dict(correct, fill=(correct["fill"] + 2) % 4),
                         "isiannya ikut berubah, padahal isian tidak termasuk aturan"))
    if correct is not None and X["k"] == "poly" and "sides" not in kinds and correct["s"]:
        tiers[2].append((dict(correct, s=correct["s"] + 1 if correct["s"] < 8 else 3),
                         "bentuk bangunnya ikut berubah, padahal bentuk tidak termasuk aturan"))
    if correct is not None and X["k"] == "nest":
        if "swapfill" not in kinds:
            tiers[2].append((apply(correct, ("swapfill",)), "isian bangun luar dan dalam ikut tertukar"))
        if "inv" not in kinds:
            tiers[2].append((apply(correct, ("inv",)), "warnanya ikut terbalik"))
        tiers[2].append((dict(correct, i=correct["o"]),
                         f"bangun dalamnya {correct['o']}, padahal seharusnya {correct['i']}"))
        tiers[2].append((dict(correct, o=correct["i"]),
                         f"bangun luarnya {correct['i']}, padahal seharusnya {correct['o']}"))
    if correct is not None and X["k"] == "lines":
        if "mirunion" in kinds:
            tiers[2].append((LN(seg_union(X["g"], map_segs(X["g"], ("rot", 180)))),
                             "digabung dengan hasil putaran 180°, bukan dengan bayangan cerminnya"))
        if len(correct["g"]) > 3:
            tiers[2].append((LN(correct["g"][:-1]), "ada satu garis yang hilang"))
    tiers[3].append((X, unchanged_note))
    if prev is not None:
        tiers[3].append((prev, "mengulang gambar sebelumnya"))
    tiers[3].append((apply(correct, full), "perubahannya diterapkan dua kali"))
    # selang-seling antar tingkat agar jenis pengecoh beragam
    out = []
    for i in range(max(len(t) for t in tiers)):
        for t in tiers:
            if i < len(t):
                out.append(t[i])
    return correct, out


# ----------------------------------------------------------------------------- pembangkit state acak
SHAPES_N = ["lingkaran", "segitiga", "persegi", "segilima", "segienam", "bintang", "belah ketupat"]


def rand_lines(rng, nmin, nmax, asym=True, connected=True):
    for _ in range(5000):
        g = sorted(rng.sample(range(len(SEGS)), rng.randint(nmin, nmax)))
        if connected and lines_faces(g)[1] != 1:
            continue
        if asym and any(list(map_segs(g, key)) == g for key in PT_MAP):
            continue
        return g
    raise RuntimeError("rand_lines gagal")


def lines_sym_keys(g):
    return [key for key in PT_MAP if list(map_segs(g, key)) == sorted(g)]


def gen_motif(rng, b, spec, ops, n):
    step = 45 if any(o[0] == "rot" and o[1] % 90 for o in ops) else 90
    fill = spec.get("fill")
    if fill is None:
        fm = [o for o in ops if o[0] in ("fillm", "fillt")]
        fill = fm[0][1] if fm else rng.choice([0, 2, 3])
    return M(b, rot=rng.randrange(0, 360, step), mir=0, fill=fill, n=n, sz=spec.get("sz", 2))


def gen_pair_analogy(rng, spec, ops):
    k = spec["kind"]
    if k == "motif":
        A = gen_motif(rng, spec["bA"], spec, ops, spec.get("nA"))
        C = gen_motif(rng, spec["bC"], dict(spec, fill=A["fill"]), ops, spec.get("nC"))
    elif k == "poly":
        f = spec.get("fill")
        if f is None:
            fm = [o for o in ops if o[0] in ("fillm", "fillt")]
            f = fm[0][1] if fm else 0
        A = PL(spec["sA"], f, spec.get("nA", 0))
        C = PL(spec["sC"], spec.get("fillC", f), spec.get("nC", 0))
    elif k == "nest":
        A, C = NS(*spec["A"]), NS(*spec["C"])
    elif k == "grid":
        r, toks = spec["r"], spec["tok"]
        pa = rng.sample(range(r), len(toks))
        pc = rng.sample(range(r), len(toks))
        A, C = GR(r, zip(toks, pa)), GR(r, zip(toks, pc))
    elif k == "clock":
        a = rng.sample(range(8), 2)
        c = rng.sample(range(8), 2)
        A, C = CK(*a), CK(*c)
    elif k == "lines":
        mu = any(o[0] == "mirunion" for o in ops)
        A = LN(rand_lines(rng, 3 if mu else 5, 4 if mu else 7))
        C = LN(rand_lines(rng, 3 if mu else 5, 4 if mu else 7))
    else:
        raise ValueError(k)
    return A, C


def build_analogy(rng, spec):
    ops = spec["ops"]
    full = compose_ops(ops)
    A, C = gen_pair_analogy(rng, spec, ops)
    B = apply(A, full)
    if B is None or skey(A) == skey(C) or same_vis(A, C) or same_vis(A, B):
        return None
    correct, cands = generic_cands(C, ops, "sama dengan gambar ketiga, tidak ada perubahan")
    if correct is None or same_vis(correct, C) or same_vis(correct, B):
        return None
    if any(has_collision(x) for x in (A, B, C, correct)):
        return None
    d = pick_distractors(correct, cands)
    if d is None:
        return None
    subj = MOTIF_NAMA.get(C.get("b"), "") if C["k"] == "motif" else ""
    rule = join_id([desc(o, A) for o in ops])
    res = join_id([result(o, correct) for o in ops])
    if sorted(o[0] for o in ops) == ["swap", "swapfill"]:   # gabungan dua aturan = bangun pindah beserta isiannya
        rule = ("bangun luar dan bangun dalam bertukar posisi, dan setiap bangun membawa isiannya sendiri "
                "(bentuk dan isian sama-sama berpindah)")
        res = (f"{correct['o']} ({FILL_NAMA[correct['fo']]}) menjadi bangun luar dan {correct['i']} "
               f"({FILL_NAMA[correct['fi']]}) menjadi bangun dalam")
    return {
        "type": "analogi", "stems": [A, B, C], "answer": correct, "distr": d, "ops": ops, "level": 1 if len(ops) == 1 else 2,
        "rule_text": f"Dari gambar pertama ke gambar kedua, {rule}.",
        "apply_text": f"Aturan yang sama diterapkan pada gambar ketiga{(' (' + subj + ')') if subj else ''}: {res}",
        "check": lambda st=C, op=full: apply(st, op),
    }


def build_serial(rng, spec):
    ops = spec["ops"]
    n = spec["len"]
    mode = spec.get("mode", "simul")
    k = spec["kind"]
    if k == "motif":
        s0 = gen_motif(rng, spec["b"], spec, ops if mode == "simul" else ops, spec.get("n0"))
        if "sz0" in spec:
            s0["sz"] = spec["sz0"]
    elif k == "poly":
        s0 = PL(spec["s"], spec.get("f0", spec.get("fill", 0)), spec.get("n0", 0))
    elif k == "grid":
        s0 = GR(spec["r"], zip(spec["tok"], rng.sample(range(spec["r"]), len(spec["tok"]))))
    elif k == "clock":
        s0 = CK(*rng.sample(range(8), 2))
    elif k == "lines":
        s0 = LN(rand_lines(rng, 5, 7))
    else:
        raise ValueError(k)
    if mode == "simul":
        step_ops = [compose_ops(ops)] * n
    else:
        step_ops = [ops[i % 2] for i in range(n)]
    st = [s0]
    for i in range(n - 1):
        nx = apply(st[-1], step_ops[i])
        if nx is None:
            return None
        st.append(nx)
    if any(has_collision(x) for x in st):
        return None
    if any(same_vis(st[i], st[i + 1]) for i in range(n - 1)):
        return None
    X = st[-1]
    nxt = step_ops[n - 1]
    if mode == "simul":
        correct, cands = generic_cands(X, ops, "sama dengan gambar terakhir pada deret", prev=st[-2])
    else:
        other = ops[1] if nxt == ops[0] else ops[0]
        correct, cands0 = generic_cands(X, [nxt], "sama dengan gambar terakhir pada deret", prev=st[-2])
        cands = [(apply(X, other), f"yang diterapkan {short(other)}, padahal giliran berikutnya adalah {short(nxt)}"),
                 (apply(X, ("seq", nxt, other)), "kedua aturan diterapkan sekaligus, padahal aturannya berselang-seling")]
        cands += cands0
    if correct is None or has_collision(correct):
        return None
    d = pick_distractors(correct, cands)
    if d is None:
        return None
    if mode == "simul":
        rule = join_id([desc(o, s0) for o in ops])
        rule_text = f"Setiap langkah, {rule}."
        res = join_id([result(o, correct) for o in ops])
        apply_text = f"Maka gambar berikutnya: {res}"
        level = 1 if len(ops) == 1 else 2
    else:
        rule_text = (f"Aturannya berselang-seling: langkah pertama {desc(ops[0], s0)}, langkah berikutnya "
                     f"{desc(ops[1], s0)}, begitu seterusnya. Perubahan terakhir pada deret adalah {short(step_ops[n - 2])}.")
        apply_text = f"Maka giliran berikutnya adalah {short(nxt)}: {result(nxt, correct)}"
        level = 2
    return {"type": "serial", "stems": st, "answer": correct, "distr": d, "ops": ops, "level": level,
            "rule_text": rule_text, "apply_text": apply_text, "check": lambda x=X, op=nxt: apply(x, op)}


# ----------------------------------------------------------------------------- ketidaksamaan
FILL_PAIRS = [(0, 3), (3, 0), (0, 2), (2, 0), (1, 0), (0, 1), (2, 3)]
POLY_NAME = {3: "segitiga", 4: "persegi", 5: "segilima", 6: "segienam", 7: "segitujuh", 8: "segidelapan"}


def gj_rotgroup(rng, sp):
    m, step = sp["m"], sp["step"]
    fill = rng.choice([0, 2, 3])
    angles = [0, 90, 180, 270] if step == 90 else rng.sample(range(0, 360, 45), 4)
    rng.shuffle(angles)
    same = [M(m, rot=a, fill=fill) for a in angles]
    odd = M(m, rot=rng.randrange(0, 360, step), mir=1, fill=fill)
    nm = MOTIF_NAMA[m]

    def extra(opts, key):
        rots = [render(M(m, rot=a, fill=fill)) for a in range(0, 360, 45)]
        for i, o in enumerate(opts):
            is_rot = any(vdiff(render(o), r) <= SAME_TOL for r in rots)
            assert is_rot == (i != key), "rotgroup: opsi %d salah klasifikasi" % i
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "kiral", "extra": extra,
            "rule_text": f"Empat gambar adalah {nm} yang sama, hanya diputar dengan sudut berbeda.",
            "odd_text": f"Gambar {{L}} merupakan bayangan cermin {nm} tersebut sehingga tidak dapat diperoleh "
                        "hanya dengan memutar."}


def gj_sides_dots(rng, sp):
    rel = sp["rel"]
    sides = rng.sample([3, 4, 5, 6, 7, 8] if rel <= 0 else [3, 4, 5, 6, 7], 5)
    same = [PL(s, rng.choice([0, 2]), s + rel) for s in sides[:4]]
    so = sides[4]
    no = so + rel + rng.choice([-1, 1])
    if not 1 <= no <= 9:
        return None
    odd = PL(so, rng.choice([0, 2]), no)
    txt = ("banyak titik di dalam bangun sama dengan banyak sisi bangunnya" if rel == 0 else
           "banyak titik di dalam bangun selalu satu lebih sedikit daripada banyak sisi bangunnya")
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "selisih",
            "rule_text": f"Pada empat gambar, {txt}.",
            "odd_text": f"Gambar {{L}} berupa {SIDES_NAMA[so]} ({so} sisi) tetapi memiliki {no} titik."}


def gj_parity(rng, sp):
    shapes = [0, 4, 5, 6, 8]
    cnt = rng.sample([2, 4, 6, 8], 4)
    no = rng.choice([3, 5, 7])
    sh = rng.sample(shapes, 5)
    same = [PL(sh[i], rng.choice([0, 2]), cnt[i]) for i in range(4)]
    odd = PL(sh[4], rng.choice([0, 2]), no)
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "paritas",
            "rule_text": "Empat gambar memiliki banyak titik genap (habis dibagi dua), apa pun bentuk bangunnya.",
            "odd_text": f"Gambar {{L}} memiliki {no} titik (ganjil)."}


def gj_regions(rng, sp):
    r = sp["r"]
    lo, hi = {2: (5, 7), 3: (6, 8), 4: (7, 9)}[r]
    r2 = r + rng.choice([-1, 1])

    def make(target):
        for _ in range(20000):
            g = rand_lines(rng, lo, hi, asym=False)
            if lines_faces(g)[0] == target:
                return LN(g)
        raise RuntimeError("regions")
    same = [make(r) for _ in range(4)]
    odd = make(r2)

    def extra(opts, key):
        for o in opts:
            assert bitmap_regions(render(o)) == lines_faces(o["g"])[0], "regions: bitmap != Euler"
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "daerah", "extra": extra,
            "rule_text": f"Empat gambar masing-masing membentuk tepat {r} daerah tertutup.",
            "odd_text": f"Gambar {{L}} membentuk {r2} daerah tertutup."}


def gj_sym(rng, sp):
    axes = ["v", "h", "d1", "d2"] if sp.get("diag") else ["v", "h"]
    same = []
    used = []
    for i in range(4):
        ax = axes[i % len(axes)] if sp.get("diag") else rng.choice(axes)
        for _ in range(20000):
            half = rand_lines(rng, 2, 4, asym=False, connected=False)
            g = seg_union(half, map_segs(half, ("mir", ax)))
            if 4 <= len(g) <= 8 and lines_faces(g)[1] == 1 and not any(
                    ("rot", d) in [k for k in lines_sym_keys(g)] for d in (90, 270)):
                break
        else:
            raise RuntimeError("sym")
        same.append(LN(g))
        used.append(ax)
    odd = LN(rand_lines(rng, 4, 8, asym=True))

    def extra(opts, key):
        for i, o in enumerate(opts):
            bm = bool(sym_axes(render(o))[0])
            st = any(k[0] == "mir" for k in lines_sym_keys(o["g"]))
            assert bm == st == (i != key), "sym: bitmap/state tidak cocok pada opsi %d" % i
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "simetri-lipat", "extra": extra,
            "rule_text": "Empat gambar memiliki sumbu simetri: bila dilipat pada sumbu itu (tegak, mendatar"
                         + (", atau diagonal" if sp.get("diag") else "") + "), kedua bagiannya tepat berimpit.",
            "odd_text": "Gambar {L} tidak memiliki sumbu simetri sama sekali."}


def gj_clock_angle(rng, sp):
    a = sp["a"]
    seen, same = set(), []
    while len(same) < 4:
        h0 = rng.randrange(8)
        h1 = (h0 + rng.choice([a, -a])) % 8
        if (h0, h1) not in seen:
            seen.add((h0, h1))
            same.append(CK(h0, h1))
    a2 = rng.choice([x for x in (a - 1, a + 1) if 1 <= x <= 4])
    h0 = rng.randrange(8)
    odd = CK(h0, h0 + rng.choice([a2, -a2]))
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "sudut",
            "rule_text": f"Pada empat gambar, kedua jarum selalu membentuk sudut {a * 45}°.",
            "odd_text": f"Pada Gambar {{L}}, sudut antara kedua jarum {a2 * 45}°."}


def gj_nest_same(rng, sp):
    sh = rng.sample(["lingkaran", "segitiga", "persegi", "segilima", "segienam", "bintang"], 4)
    same = [NS(s, s, *rng.choice(FILL_PAIRS)) for s in sh]
    o, i = rng.sample(["lingkaran", "segitiga", "persegi", "segienam", "bintang"], 2)
    odd = NS(o, i, *rng.choice(FILL_PAIRS))
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "sama",
            "rule_text": "Pada empat gambar, bangun di bagian dalam sama bentuknya dengan bangun di bagian luar.",
            "odd_text": f"Gambar {{L}} berupa {o} dengan {i} di dalamnya (bentuknya berbeda)."}


def gj_nest_rel(rng, sp):
    same = []
    for so in rng.sample([3, 4, 5], 3) + [rng.choice([3, 4, 5])]:
        same.append(NS(POLY_NAME[so], POLY_NAME[so + 1], *rng.choice(FILL_PAIRS)))
    so = rng.choice([3, 4])
    si = rng.choice([so, so + 2])
    odd = NS(POLY_NAME[so], POLY_NAME[si], *rng.choice(FILL_PAIRS))
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "relasi",
            "rule_text": "Pada empat gambar, bangun dalam selalu memiliki satu sisi lebih banyak daripada bangun luarnya.",
            "odd_text": f"Pada Gambar {{L}}, bangun luar {SIDES_NAMA[so]} sedangkan bangun dalam {SIDES_NAMA[si]}."}


def gj_bw(rng, sp):
    d = sp["d"]

    def make(nb, nw):
        pos = rng.sample(range(9), nb + nw)
        cols = [1] * nb + [0] * nw
        rng.shuffle(cols)
        return BW(zip(pos, cols))
    same = []
    for nw in rng.sample([1, 2, 3], 3) + [rng.choice([1, 2, 3])]:
        same.append(make(nw + d, nw))
    nw = rng.choice([1, 2, 3])
    dd = d + rng.choice([-1, 1])
    odd = make(nw + dd, nw)
    txt = ("banyak lingkaran hitam sama dengan banyak lingkaran putih" if d == 0 else
           f"lingkaran hitam selalu {d} lebih banyak daripada lingkaran putih")
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "selisih",
            "rule_text": f"Pada empat gambar, {txt}.",
            "odd_text": f"Gambar {{L}} memiliki {nw + dd} lingkaran hitam dan {nw} lingkaran putih."}


def gj_grid_gap(rng, sp):
    gap = sp["gap"]
    pb = rng.sample(range(8), 5)
    same = [GR(8, [("hitam", p), ("putih", (p + gap) % 8)]) for p in pb[:4]]
    g2 = rng.choice([3, 5] if gap == 4 else [3, 4, 5])
    odd = GR(8, [("hitam", pb[4]), ("putih", (pb[4] + g2) % 8)])
    txt = ("lingkaran hitam dan lingkaran putih selalu berseberangan (segaris melewati kotak tengah)" if gap == 4 else
           "lingkaran putih selalu tepat satu kotak searah jarum jam dari lingkaran hitam (bersebelahan di tepi)")
    return {"type": "ganjil", "same": same, "odd": odd, "feature": "jarak",
            "rule_text": f"Pada empat gambar, {txt}.",
            "odd_text": f"Pada Gambar {{L}}, lingkaran putih berada {g2} kotak searah jarum jam dari lingkaran hitam."}


# ----------------------------------------------------------------------------- serial khusus
def se_overlay(rng, sp):
    mode = sp["mode"]
    f = seg_xor if mode == "xor" else seg_union

    def triple():
        for _ in range(20000):
            a = rand_lines(rng, 3, 5, asym=False, connected=False)
            b = rand_lines(rng, 3, 5, asym=False, connected=False)
            it = seg_inter(a, b)
            c = f(a, b)
            if 1 <= len(it) <= 2 and 3 <= len(c) <= 8 and c != sorted(a) and c != sorted(b) and \
                    len(set(a) - set(b)) >= 1 and len(set(b) - set(a)) >= 1:
                return a, b, c
        raise RuntimeError("overlay")
    a, b, c = triple()
    d_, e, ans = triple()
    st = [LN(a), LN(b), LN(c), LN(d_), LN(e)]
    correct = LN(ans)
    it = seg_inter(d_, e)
    other = seg_union(d_, e) if mode == "xor" else seg_xor(d_, e)
    spare = [x for x in range(len(SEGS)) if x not in set(d_) | set(e)]
    cands = [(LN(other), "garis yang sama tidak dihapus" if mode == "xor" else "garis yang sama justru dihapus"),
             (LN(it), "hanya garis yang sama yang dipertahankan"),
             (LN(ans + [it[0]]) if mode == "xor" else LN(ans + [rng.choice(spare)]),
              "masih ada garis yang seharusnya dihapus" if mode == "xor" else "ada garis tambahan yang tidak berasal dari gambar ke-4 maupun ke-5"),
             (LN(ans[1:]), "ada garis yang hilang"),
             (LN(e), "sama dengan gambar kelima")]
    dd = pick_distractors(correct, cands)
    if dd is None or same_vis(correct, st[3]) or same_vis(correct, st[4]):
        return None
    if mode == "xor":
        rule = ("Deret dibaca per tiga gambar: gambar ke-3 adalah gabungan gambar ke-1 dan ke-2, tetapi garis yang "
                "terdapat pada keduanya dihapus (hanya garis yang tidak sama yang dipertahankan).")
        app = "Dengan cara yang sama, gambar ke-6 adalah gabungan gambar ke-4 dan ke-5 tanpa garis yang sama"
    else:
        rule = ("Deret dibaca per tiga gambar: gambar ke-3 adalah gabungan seluruh garis gambar ke-1 dan ke-2 "
                "(garis yang sama tetap digambar satu kali).")
        app = "Dengan cara yang sama, gambar ke-6 memuat semua garis dari gambar ke-4 dan ke-5"
    return {"type": "serial", "stems": st, "answer": correct, "distr": dd, "ops": [(mode,)], "level": 3,
            "group3": True, "rule_text": rule, "apply_text": app,
            "check": lambda: LN(f(d_, e))}


def se_interleave(rng, sp):
    ek, eb, eop = sp["ev"]
    ok, ob, oop = sp["od"]

    def mk(kind, base, op):
        if kind == "motif":
            return M(base, rot=rng.randrange(0, 360, 90), fill=rng.choice([0, 2, 3]),
                     n=None if op[0] != "cnt" else rng.choice([1, 2]))
        return PL(base, rng.choice([0, 2]), 1 if op[0] == "cnt" else 0)
    e0, o0 = mk(ek, eb, eop), mk(ok, ob, oop)
    e1, e2, e3 = apply(e0, eop), None, None
    e2 = apply(e1, eop)
    e3 = apply(e2, eop)
    o1 = apply(o0, oop)
    o2 = apply(o1, oop)
    if None in (e1, e2, e3, o1, o2):
        return None
    st = [e0, o0, e1, o1, e2]
    correct, cands = generic_cands(o1, [oop], "sama dengan gambar ke-4 (tidak berubah)")
    cands = [(e3, "melanjutkan deret gambar ke-1, 3, 5; padahal tanda tanya adalah gambar ke-6 yang mengikuti "
                  "deret gambar ke-2, 4, 6")] + cands
    dd = pick_distractors(correct, cands)
    if dd is None:
        return None
    return {"type": "serial", "stems": st, "answer": correct, "distr": dd, "ops": [("dua-deret", eop, oop)],
            "level": 3,
            "rule_text": f"Deret terdiri atas dua pola yang berselang. Gambar ke-1, 3, 5: {desc(eop, e0)}. "
                         f"Gambar ke-2, 4, 6: {desc(oop, o0)}.",
            "apply_text": f"Tanda tanya adalah gambar ke-6 sehingga mengikuti pola kedua: {result(oop, correct)}",
            "check": lambda: apply(o1, oop)}


# ----------------------------------------------------------------------------- rencana 80 soal
def AN(kind, ops, diff, basis, **kw):
    return dict(t="analogi", builder="an", kind=kind, ops=ops, diff=diff, basis=basis, **kw)


def SE(kind, ops, diff, basis, **kw):
    return dict(t="serial", builder="se", kind=kind, ops=ops, diff=diff, basis=basis, **kw)


def GJ(tpl, diff, basis, **kw):
    return dict(t="ganjil", builder=tpl, diff=diff, basis=basis, **kw)


def SC(tpl, diff, basis, **kw):
    return dict(t="serial", builder=tpl, diff=diff, basis=basis, **kw)


PO, PR = "pola-2024", "prediksi-2027"
PLAN = [
    # paket 1
    AN("motif", [("rot", 90)], "mudah", PO, bA="bendera", bC="kunci"),
    AN("poly", [("sides", 1)], "mudah", PO, sA=3, sC=5, fill=2),
    AN("poly", [("cnt", 2)], "sedang", PO, sA=4, sC=0, nA=3, nC=2, fill=0),
    GJ("rotgroup", "sedang", PO, m="sepatu", step=90),
    GJ("sides_dots", "sedang", PO, rel=0),
    SE("poly", [("cnt", 1)], "mudah", PO, s=4, n0=1, len=4, fill=0),
    SE("motif", [("rot", 90)], "sedang", PO, b="palu", len=4),
    SE("motif", [("rot", 90), ("cnt", 1)], "sulit", PR, b="bendera", n0=1, len=4),
    # paket 2
    AN("motif", [("mir", "v")], "mudah", PO, bA="sepatu", bC="palu"),
    AN("nest", [("swap",)], "sedang", PO, A=("lingkaran", "segitiga", 0, 3), C=("persegi", "bintang", 0, 3)),
    AN("grid", [("move", 0, 2)], "sedang", PO, r=8, tok=["bintang"]),
    GJ("regions", "sedang", PO, r=2),
    GJ("parity", "mudah", PO),
    SE("poly", [("sides", 1)], "mudah", PO, s=3, len=4, fill=2),
    SE("poly", [("fillc", 1)], "sedang", PO, s=6, f0=0, len=5),
    SE("poly", [("sides", 1), ("fillt", 0, 3)], "sulit", PR, s=3, f0=3, len=4),
    # paket 3
    AN("motif", [("rot", 270)], "sedang", PO, bA="siku", bC="kait"),
    AN("nest", [("swapfill",)], "sedang", PO, A=("segienam", "lingkaran", 3, 2), C=("persegi", "segitiga", 1, 0)),
    AN("motif", [("rot", 180), ("fillm", 0, 3)], "sulit", PR, bA="segitiga", bC="bendera"),
    GJ("clock_angle", "sedang", PO, a=2),
    GJ("nest_same", "mudah", PO),
    SE("poly", [("cnt", 2)], "mudah", PO, s=0, n0=1, len=4, fill=0),
    SE("grid", [("move", 0, -1)], "mudah", PO, r=8, tok=["hitam"], len=5),
    SE("motif", [("rot", 90), ("cnt", 1)], "sulit", PR, b="kunci", n0=1, len=5, mode="alt"),
    # paket 4
    AN("motif", [("mir", "h")], "sedang", PO, bA="kunci", bC="bendera"),
    AN("poly", [("sides", 2)], "mudah", PO, sA=4, sC=3, fill=3),
    AN("lines", [("rot", 90)], "sedang", PO),
    GJ("sym", "sedang", PO),
    GJ("rotgroup", "mudah", PO, m="panah", step=90),
    SE("lines", [("rot", 90)], "sedang", PO, len=4),
    SC("overlay", "sedang", PR, mode="union"),
    SE("clock", [("hand", 0, 1), ("hand", 1, -2)], "sulit", PR, len=4),
    # paket 5
    AN("motif", [("rot", 45)], "sedang", PO, bA="palu", bC="sepatu"),
    AN("poly", [("cnt", 1)], "mudah", PO, sA=3, sC=6, nA=2, nC=4, fill=2),
    AN("lines", [("mirunion", "v")], "sulit", PR),
    GJ("bw", "mudah", PO, d=0),
    GJ("regions", "sulit", PO, r=3),
    SE("motif", [("rot", 135)], "sedang", PO, b="kunci", len=4),
    SE("grid", [("move", 0, 3)], "sedang", PO, r=8, tok=["segitiga"], len=4),
    SE("motif", [("rot", 45), ("sizec", 2)], "sedang", PR, b="siku", len=5, sz0=2),
    # paket 6
    AN("motif", [("rot", 135)], "sedang", PO, bA="kait", bC="segitiga"),
    AN("motif", [("mir", "v"), ("cnt", 1)], "sulit", PR, bA="bendera", bC="sepatu", nA=2, nC=3),
    AN("grid", [("move", 0, 1), ("move", 1, -2)], "sulit", PR, r=8, tok=["hitam", "putih"]),
    GJ("rotgroup", "sedang", PO, m="kunci", step=45),
    GJ("grid_gap", "mudah", PO, gap=4),
    SC("overlay", "sulit", PR, mode="xor", v=1),
    SE("motif", [("rot", 270), ("cnt", 2)], "sedang", PR, b="segitiga", n0=0, len=4),
    SE("grid", [("move", 0, 1), ("move", 1, -1)], "sedang", PR, r=8, tok=["hitam", "segitiga"], len=4),
    # paket 7
    AN("poly", [("sides", 1), ("cnt", -1)], "sedang", PR, sA=4, sC=5, nA=4, nC=3, fill=0),
    AN("nest", [("swap",), ("inv",)], "sedang", PR, A=("persegi", "lingkaran", 0, 3), C=("segilima", "segitiga", 3, 0)),
    AN("clock", [("hand", 0, 2), ("hand", 1, -1)], "sulit", PR),
    GJ("regions", "sulit", PO, r=4),
    GJ("sides_dots", "sedang", PR, rel=-1),
    SC("interleave", "sulit", PR, ev=("motif", "bendera", ("rot", 90)), od=("poly", 5, ("cnt", 1))),
    SE("motif", [("rot", 270)], "mudah", PO, b="sepatu", len=5),
    SE("poly", [("cnt", -1)], "mudah", PO, s=0, n0=8, len=4, fill=2),
    # paket 8
    AN("motif", [("rot", 270), ("size", -2)], "sedang", PR, bA="panah", bC="kunci"),
    AN("poly", [("sides", 1), ("fillm", 3, 2)], "sedang", PR, sA=5, sC=3),
    AN("lines", [("mir", "h")], "mudah", PO),
    GJ("sym", "sulit", PO, diag=True),
    GJ("clock_angle", "sedang", PO, a=3),
    SC("overlay", "sulit", PR, mode="xor", v=2),
    SE("poly", [("fillc", 1), ("cnt", 1)], "sedang", PR, s=4, f0=0, n0=1, len=4),
    SE("clock", [("hand", 0, -1), ("hand", 1, 2)], "sulit", PR, len=5),
    # paket 9
    AN("motif", [("rot", 315), ("fillm", 1, 0)], "sulit", PR, bA="sepatu", bC="siku"),
    AN("lines", [("mirunion", "h")], "sedang", PR),
    AN("grid", [("move", 0, -3)], "sedang", PO, r=8, tok=["silang"]),
    GJ("bw", "sedang", PR, d=1),
    GJ("nest_rel", "sedang", PR, rel=1),
    SE("motif", [("mir", "v"), ("rot", 90)], "sulit", PR, b="palu", len=5, mode="alt"),
    SE("grid", [("move", 0, 2), ("move", 1, 1)], "sedang", PO, r=8, tok=["bintang", "putih"], len=4),
    SE("poly", [("sides", -1)], "mudah", PO, s=8, len=4, fill=1),
    # paket 10
    AN("motif", [("mir", "h"), ("cnt", 2)], "sulit", PR, bA="kait", bC="panah", nA=1, nC=3),
    AN("nest", [("swap",), ("swapfill",)], "sedang", PR, A=("segitiga", "persegi", 2, 0), C=("lingkaran", "segienam", 1, 3)),
    AN("motif", [("rot", 180)], "mudah", PO, bA="segitiga", bC="palu"),
    GJ("rotgroup", "sedang", PO, m="palu", step=45),
    GJ("grid_gap", "sedang", PR, gap=1),
    SE("motif", [("rot", 45), ("cnt", 1)], "sulit", PR, b="kait", n0=1, len=5),
    SC("interleave", "sulit", PR, ev=("poly", 3, ("sides", 1)), od=("motif", "siku", ("rot", 270))),
    SE("lines", [("rot", 270)], "sedang", PO, len=4),
]
GJ_FUN = {"rotgroup": gj_rotgroup, "sides_dots": gj_sides_dots, "parity": gj_parity, "regions": gj_regions,
          "sym": gj_sym, "clock_angle": gj_clock_angle, "nest_same": gj_nest_same, "nest_rel": gj_nest_rel,
          "bw": gj_bw, "grid_gap": gj_grid_gap}


def build(spec, rng):
    b = spec["builder"]
    if b == "an":
        return build_analogy(rng, spec)
    if b == "se":
        return build_serial(rng, spec)
    if b == "overlay":
        return se_overlay(rng, spec)
    if b == "interleave":
        return se_interleave(rng, spec)
    return GJ_FUN[b](rng, spec)


def strict_key(spec):
    base = tuple(str(spec.get(k)) for k in ("kind", "bA", "bC", "b", "sA", "sC", "s", "m", "A", "C", "r", "tok",
                                            "rel", "a", "d", "gap", "mode", "v", "ev", "od", "diag", "fill", "nA", "n0"))
    return (spec["t"], spec["builder"], repr(spec.get("ops")), base)


def topic_of(spec, item):
    t = {"analogi": "analogi gambar", "serial": "deret gambar", "ganjil": "gambar yang berbeda"}[spec["t"]]
    if spec["t"] == "ganjil":
        r = f"invarian {item['feature']}"
    elif spec["builder"] == "overlay":
        r = "gabungan garis " + ("XOR (garis sama dihapus)" if spec["mode"] == "xor" else "(union)")
    elif spec["builder"] == "interleave":
        r = "dua deret berselang"
    else:
        r = (" + ".join(short(o) + ("" if len(o) == 1 else " " + " ".join(str(x) for x in o[1:])) for o in spec["ops"])
             + (" (selang-seling)" if spec.get("mode") == "alt" else ""))
    bases = [str(spec[k]) for k in ("bA", "bC", "b", "m") if spec.get(k)]
    return f"{t}: {r}" + (f" [{', '.join(bases)}]" if bases else "")


BODY = {
    "analogi": ["Perhatikan gambar berikut. Hubungan gambar pertama dengan gambar kedua sama dengan hubungan gambar "
                "ketiga dengan gambar yang ditandai \"?\". Gambar manakah yang tepat menggantikan tanda tanya?",
                "Gambar pertama berhubungan dengan gambar kedua. Hubungan yang sama berlaku antara gambar ketiga dan "
                "gambar \"?\". Pilihlah gambar yang tepat.",
                "Tentukan gambar pengganti tanda tanya agar hubungan gambar ketiga dengan \"?\" sama dengan hubungan "
                "gambar pertama dengan gambar kedua."],
    "serial": ["Gambar manakah yang tepat untuk melanjutkan deret gambar berikut (menggantikan tanda tanya)?",
               "Perhatikan pola perubahan pada deret gambar berikut. Gambar manakah yang tepat menggantikan tanda tanya?",
               "Tentukan gambar berikutnya yang sesuai dengan pola deret gambar di bawah ini."],
    "ganjil": ["Empat dari lima gambar berikut mengikuti pola yang sama. Gambar manakah yang berbeda?",
               "Manakah gambar yang tidak sesuai dengan pola gambar-gambar lainnya?"],
}
FILE_KIND = {"analogi": "analogi", "serial": "serial", "ganjil": "ketidaksamaan"}


# ----------------------------------------------------------------------------- komposisi gambar
W_IMG = 1200
BORDER = 70


def _panel(img, dr, x, y, arr=None, q=False):
    if arr is not None:
        img.paste(Image.fromarray(arr), (x, y))
    dr.rectangle((x, y, x + P - 1, y + P - 1), outline=BORDER, width=2)
    if q:
        f = font(76)
        dr.text((x + P / 2, y + P / 2 + 2), "?", font=f, fill=INK, anchor="mm")


def compose(item, opts):
    gj = item["type"] == "ganjil"
    H = 236 if gj else 440
    img = Image.new("L", (W_IMG, H), WHITE)
    dr = ImageDraw.Draw(img)
    if not gj:
        y = 22
        st = item["stems"]
        if item["type"] == "analogi":
            sym_w = 64
            x = (W_IMG - (4 * P + 3 * sym_w)) // 2
            seq = [st[0], ":", st[1], "=", st[2], ":", None]
            for el in seq:
                if isinstance(el, str):
                    dr.text((x + sym_w / 2, y + P / 2), el, font=font(46), fill=INK, anchor="mm")
                    x += sym_w
                else:
                    _panel(img, dr, x, y, render(el) if el is not None else None, q=el is None)
                    x += P
        else:
            m = len(st) + 1
            gaps = [22] * (m - 1)
            if item.get("group3"):
                gaps[2] = 74
            x = (W_IMG - (m * P + sum(gaps))) // 2
            for i in range(m):
                _panel(img, dr, x, y, render(st[i]) if i < len(st) else None, q=i == len(st))
                if i < m - 1:
                    x += P + gaps[i]
        ys = y + P + 26
        dr.line((70, ys, W_IMG - 70, ys), fill=200, width=1)
        oy = ys + 26
    else:
        oy = 22
    gap = 52
    x = (W_IMG - (5 * P + 4 * gap)) // 2
    f = font(30)
    for i, o in enumerate(opts):
        _panel(img, dr, x, oy, render(o))
        dr.text((x + P / 2, oy + P + 10), LETTERS[i], font=f, fill=INK, anchor="mt")
        x += P + gap
    return img


def save_png(img, path):
    q = img.point(lambda v: int(round(v / 17.0)) * 17)
    q.convert("P", palette=Image.ADAPTIVE, colors=16).save(path, optimize=True)


# ----------------------------------------------------------------------------- validasi
class Bad(Exception):
    pass


def need(cond, msg):
    if not cond:
        raise Bad(msg)


def validate(item, opts, key):
    R = [render(o) for o in opts]
    for i in range(5):
        for j in range(i + 1, 5):
            need(vdiff(R[i], R[j]) >= DISTINCT_MIN, f"opsi {LETTERS[i]} dan {LETTERS[j]} terlalu mirip")
    for o in opts:
        need(not has_collision(o), "token bertabrakan")
    if item["type"] == "ganjil":
        F = [features(o) for o in opts]
        f0 = item["feature"]
        need(outlier([f[f0] for f in F]) == key, f"invarian {f0} tidak menunjuk kunci")
        for name in F[0]:
            if name == f0 or any(name not in f for f in F):
                continue
            o = outlier([f[name] for f in F])
            if o is not None and o != key:
                raise Bad(f"fitur lain '{name}' menunjuk opsi {LETTERS[o]}")
        if item.get("extra"):
            try:
                item["extra"](opts, key)
            except AssertionError as e:
                raise Bad(str(e))
        return {"level": "invarian"}
    st = item["stems"]
    for s in st:
        need(not has_collision(s), "token bertabrakan (soal)")
    if item["type"] == "analogi":
        level, preds = solve_analogy(*st)
    else:
        level, preds = solve_serial(st)
    need(level is not None and preds, "pemecah tidak menemukan aturan")
    need(level == item["level"], f"aturan lebih sederhana ditemukan (tingkat {level}, dirancang {item['level']}): "
         + "; ".join(repr(v[1]) for v in list(preds.values())[:3]))
    need(unique_pred(preds), "lebih dari satu jawaban mungkin: " + "; ".join(repr(v[1]) for v in list(preds.values())[:4]))
    pred = next(iter(preds.values()))[0]
    match = [i for i in range(5) if vdiff(render(pred), R[i]) <= SAME_TOL]
    need(match == [key], f"prediksi pemecah cocok dengan {match}, kunci {key}")
    exp = item["check"]()
    need(exp is not None and vdiff(render(exp), R[key]) <= SAME_TOL, "turunan ulang dari parameter aturan != kunci")
    for i in range(5):
        if i != key:
            need(vdiff(render(pred), R[i]) >= DISTINCT_MIN, "pengecoh terlalu mirip kunci")
    return {"level": level, "rules": sorted({repr(v[1]) for v in preds.values()})}


def check_conventions():
    """Konvensi arah gambar diuji terhadap transformasi bitmap numpy (independen dari state)."""
    tol, far = 8, 120

    def t(name, s, op, f_ok, f_bad=None):
        a, b = render(s), render(apply(s, op))
        d = hdiff(b, np.ascontiguousarray(f_ok(a)))
        need(d <= tol, f"konvensi {name}: {d} px")
        if f_bad is not None:
            need(hdiff(b, np.ascontiguousarray(f_bad(a))) >= far, f"konvensi {name}: tak terbedakan")
    cw = lambda a: np.rot90(a, -1)
    ccw = lambda a: np.rot90(a, 1)
    for b in MOTIF:
        s = M(b, fill=2)
        imgs = [render(M(b, rot=r, mir=m, fill=2)) for m in (0, 1) for r in (0, 90, 180, 270)]
        for i in range(8):
            for j in range(i + 1, 8):
                need(vdiff(imgs[i], imgs[j]) >= DISTINCT_MIN, f"motif {b} tidak kiral/berputar simetris")
        t(f"{b} rot90", s, ("rot", 90), cw, ccw)
        t(f"{b} rot270", s, ("rot", 270), ccw, cw)
        t(f"{b} mir v", s, ("mir", "v"), np.fliplr, np.flipud)
        t(f"{b} mir h", s, ("mir", "h"), np.flipud, np.fliplr)
        t(f"{b} mir d2", s, ("mir", "d2"), lambda a: a.T)
        t(f"{b} mir d1", s, ("mir", "d1"), lambda a: a[::-1, ::-1].T)
    rng = random.Random(7)
    for _ in range(3):
        s = LN(rand_lines(rng, 5, 7))
        t("garis rot90", s, ("rot", 90), cw, ccw)
        t("garis mir v", s, ("mir", "v"), np.fliplr, np.flipud)
        t("garis mir h", s, ("mir", "h"), np.flipud, np.fliplr)
        t("garis mir d2", s, ("mir", "d2"), lambda a: a.T)
        t("garis mir d1", s, ("mir", "d1"), lambda a: a[::-1, ::-1].T)
    s = CK(1, 6)
    t("jam rot90", s, ("rot", 90), cw, ccw)
    t("jam mir v", s, ("mir", "v"), np.fliplr, np.flipud)
    s = GR(8, [("hitam", 0), ("putih", 3)])
    t("kisi rot90", s, ("rot", 90), cw, ccw)
    t("kisi geser +1 = searah jarum jam", GR(4, [("hitam", 0)]), ("move", 0, 1), cw, ccw)
    # hitung daerah: rumus Euler == bitmap
    for _ in range(25):
        g = rand_lines(rng, 4, 9, asym=False)
        need(lines_faces(g)[0] == bitmap_regions(render(LN(g))), "hitung daerah tidak konsisten")


# ----------------------------------------------------------------------------- utama
def letters_plan(rng):
    for _ in range(10000):
        L = list(LETTERS) * 16
        rng.shuffle(L)
        if all(max(L[p * 8:(p + 1) * 8].count(c) for c in LETTERS) <= 3 for p in range(10)):
            return L
    raise RuntimeError("sebaran kunci")


def main():
    preview = "--preview" in sys.argv
    need(len(PLAN) == 80, f"rencana {len(PLAN)} soal")
    check_conventions()
    print("konvensi rotasi/pencerminan/hitung daerah: OK")
    keys = [strict_key(s) for s in PLAN]
    need(len(set(keys)) == 80, "ada dua soal dengan aturan+parameter+bangun dasar yang sama")
    master = random.Random(SEED)
    letters = letters_plan(master)
    os.makedirs(OUT_DIR, exist_ok=True)
    out, previews, sizes, rejected = [], [], {}, {}
    for idx, spec in enumerate(PLAN):
        paket, slot = idx // 8 + 1, idx % 8
        kind_i = sum(1 for s in PLAN[paket * 8 - 8: idx] if s["t"] == spec["t"]) + 1
        key = LETTERS.index(letters[idx])
        last = None
        for attempt in range(400):
            rng = random.Random(SEED * 100003 + idx * 1009 + attempt)
            try:
                item = build(spec, rng)
            except RuntimeError as e:
                last = str(e)
                continue
            if item is None:
                continue
            if item["type"] == "ganjil":
                same = list(item["same"])
                rng.shuffle(same)
                opts = same[:key] + [item["odd"]] + same[key:]
                notes = {}
            else:
                d = list(item["distr"])
                rng.shuffle(d)
                opts = [s for s, _ in d[:key]] + [item["answer"]] + [s for s, _ in d[key:]]
                notes = {LETTERS[i]: n for i, (s, n) in enumerate(d[:key] + [(None, None)] + d[key:]) if i != key}
            try:
                info = validate(item, opts, key)
            except Bad as e:
                last = str(e)
                why = last.split(":")[0].split(" menunjuk")[0]
                rejected[why] = rejected.get(why, 0) + 1
                if "--verbose" in sys.argv:
                    print(f"   tolak {idx + 1} perc {attempt + 1}: {last}")
                continue
            break
        else:
            raise SystemExit(f"GAGAL membangun soal #{idx + 1} ({spec['builder']} {spec.get('ops')}): {last}")
        L = LETTERS[key]
        if item["type"] == "ganjil":
            expl = f"{item['rule_text']} {item['odd_text'].format(L=L)} Jadi, gambar yang berbeda adalah Gambar {L}."
        else:
            wrong = "; ".join(f"Gambar {k} {v}" for k, v in sorted(notes.items()))
            expl = f"{item['rule_text']} {item['apply_text']}, yaitu Gambar {L}. Pilihan lain salah: {wrong}."
        fname = f"p{paket:02d}-{FILE_KIND[spec['t']]}-{kind_i}.png"
        path = os.path.join(OUT_DIR, fname)
        img = compose(item, opts)
        save_png(img, path)
        sizes[fname] = os.path.getsize(path)
        need(sizes[fname] < 150 * 1024, f"{fname} terlalu besar")
        previews.append((fname, img))
        out.append({
            "id": f"P{paket:02d}-FIG-{slot + 1:02d}",
            "subtest": "TIU",
            "category": CAT[spec["t"]],
            "difficulty": spec["diff"],
            "basis": spec["basis"],
            "topic": topic_of(spec, item),
            "body": BODY[spec["t"]][(idx + paket) % len(BODY[spec["t"]])],
            "image": f"figural/{fname}",
            "options": [{"label": c, "body": f"Gambar {c}", "weight": 5 if i == key else 0}
                        for i, c in enumerate(LETTERS)],
            "explanation": expl,
            "verify": None,
            "paket": paket,
        })
        print(f"{out[-1]['id']} {fname:28s} kunci {L} lv={info['level']} perc={attempt + 1} "
              f"{sizes[fname] // 1024} KB")
    # ringkasan & pemeriksaan akhir
    dist = {c: sum(1 for q in out if q["options"][LETTERS.index(c)]["weight"] == 5) for c in LETTERS}
    need(all(v == 16 for v in dist.values()), f"sebaran kunci {dist}")
    for p in range(1, 11):
        cats = [q["category"] for q in out if q["paket"] == p]
        need(cats.count(CAT["analogi"]) == 3 and cats.count(CAT["ganjil"]) == 2 and cats.count(CAT["serial"]) == 3,
             f"komposisi paket {p}")
    with open(os.path.join(OUT_DIR, "figural.json"), "w", encoding="utf-8") as fh:
        json.dump({"questions": out}, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    tot = sum(sizes.values())
    print(f"\n80 soal OK. Kunci: {dist}. Total PNG {tot / 1024:.0f} KB (maks {max(sizes.values()) / 1024:.0f} KB).")
    diff = {d: sum(1 for q in out if q["difficulty"] == d) for d in ("mudah", "sedang", "sulit")}
    basis = {b: sum(1 for q in out if q["basis"] == b) for b in (PO, PR)}
    print(f"Kesulitan {diff}; basis {basis}")
    print("Kandidat yang ditolak pemeriksa otomatis (lalu dibangkitkan ulang):", rejected)
    if preview:
        pick = previews[::5][:16]
        tw = 300
        th = 120
        sheet = Image.new("L", (tw * 4, th * 4), WHITE)
        for i, (fn, im) in enumerate(pick):
            t = im.copy()
            t.thumbnail((tw - 6, th - 6))
            sheet.paste(t, ((i % 4) * tw + 3, (i // 4) * th + 3))
        sheet.save(os.path.join(OUT_DIR, "_preview.jpg"), quality=70)
        print("pratinjau: _preview.jpg ->", ", ".join(fn for fn, _ in pick))


if __name__ == "__main__":
    try:
        main()
    except Bad as e:
        print("ERROR:", e)
        sys.exit(1)
