"""
Generate gambar abstrak untuk kartu section "Fitur" di landing page (gaya lembut, editorial).
Prosedural (numpy + opencv) — tanpa model AI; ganti dengan foto bila perlu.

    python scripts/generate-feature-art.py

Hasil: apps/web/public/landing/fitur-{tryout,bank-soal,analisis,pembahasan,groupchat,materi,progres,belajar}.jpg
Satu gambar saja: python scripts/generate-feature-art.py groupchat
Kartu fitur bergaya UI: python scripts/generate-feature-art.py materi progres belajar
"""
from pathlib import Path

import cv2
import numpy as np

OUT = Path(__file__).resolve().parents[1] / "apps" / "web" / "public" / "landing"
RNG = np.random.default_rng(2027)

# Palet (RGB 0..1)
COBALT = np.array([55, 101, 246]) / 255
MINT = np.array([112, 252, 142]) / 255
OBSIDIAN = np.array([24, 29, 37]) / 255
GHOST = np.array([242, 243, 246]) / 255


def grid(w, h):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    return x / w, y / h


def finish(img, name, grain=0.018, vignette=0.10):
    """Grain film + vignette halus, lalu simpan JPEG."""
    h, w = img.shape[:2]
    x, y = grid(w, h)
    v = 1 - vignette * (((x - 0.5) ** 2 + (y - 0.5) ** 2) * 2.2)
    img = img * v[..., None]
    img = img + RNG.normal(0, grain, img.shape[:2])[..., None]
    img = np.clip(img, 0, 1)
    bgr = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    cv2.imwrite(str(OUT / f"{name}.jpg"), bgr, [cv2.IMWRITE_JPEG_QUALITY, 84, cv2.IMWRITE_JPEG_PROGRESSIVE, 1])
    print("ok", name)


def blur(a, s):
    return cv2.GaussianBlur(a, (0, 0), s) if s > 0 else a


# 1) Tryout CBT — bidang gelembung jawaban A–E dalam perspektif, depth of field.
def art_tryout(w=1400, h=1000):
    S = 2
    W, H = w * S, h * S
    canvas = np.ones((H, W, 3), np.float32) * 0.965
    depth = np.zeros((H, W), np.float32)
    horizon = int(H * 0.18)
    rows = 26
    for r in range(rows):
        t = (r + 1) / rows  # 0 jauh → 1 dekat
        z = t ** 1.9
        y = int(horizon + z * (H * 1.05 - horizon))
        rad = max(2, int(4 + z * 44 * S))
        gap = rad * 2.9
        cols = int(W / gap) + 6
        x0 = W / 2 - cols / 2 * gap + (r % 2) * gap / 2
        chosen = RNG.integers(0, 5)
        for c in range(cols):
            cx = int(x0 + c * gap)
            filled = (c % 5) == chosen
            col = COBALT if filled else np.array([0.80, 0.83, 0.86])
            th = -1 if filled else max(1, int(rad * 0.16))
            cv2.circle(canvas, (cx, y), rad, col.tolist(), th, cv2.LINE_AA)
            cv2.circle(depth, (cx, y), rad + 4, float(1 - t), -1)
    depth = blur(np.maximum(depth, np.linspace(1, 0, H, dtype=np.float32)[:, None] ** 1.5 * 0.0 + 0), 0)
    # depth of field: fokus di sepertiga bawah
    x, y = grid(W, H)
    focus = np.clip(np.abs(y - 0.72) * 2.6, 0, 1)
    layers = [canvas, blur(canvas, 3 * S), blur(canvas, 8 * S), blur(canvas, 18 * S)]
    idx = focus * (len(layers) - 1)
    out = np.zeros_like(canvas)
    for i, L in enumerate(layers):
        wgt = np.clip(1 - np.abs(idx - i), 0, 1)[..., None]
        out += L * wgt
    # kabut atas + cahaya cobalt lembut
    fog = np.clip(1 - y / 0.55, 0, 1) ** 1.6
    out = out * (1 - fog[..., None] * 0.85) + GHOST * fog[..., None] * 0.85
    glow = np.exp(-(((x - 0.62) / 0.35) ** 2 + ((y - 0.62) / 0.25) ** 2))
    out = out * (1 - 0.10 * glow[..., None]) + COBALT * 0.10 * glow[..., None]
    out = cv2.resize(out, (w, h), interpolation=cv2.INTER_AREA)
    finish(out, "fitur-tryout")


# 2) Bank soal — membran sel (Voronoi) putih dengan inti cahaya cobalt.
def art_bank(w=1000, h=750):
    from scipy.spatial import cKDTree

    x, y = grid(w, h)
    # distorsi swirl organik
    cx, cy = 0.46, 0.62
    dx, dy = x - cx, y - cy
    r = np.sqrt(dx**2 + dy**2)
    ang = np.arctan2(dy, dx) + 1.1 * np.exp(-r * 3.2)
    px = cx + r * np.cos(ang) * (1 + 0.25 * np.sin(6 * ang))
    py = cy + r * np.sin(ang)
    seeds = RNG.random((900, 2))
    # sel lebih rapat di dekat pusat
    seeds = np.vstack([seeds, np.array([cx, cy]) + RNG.normal(0, 0.12, (700, 2))])
    tree = cKDTree(seeds)
    d, _ = tree.query(np.stack([px.ravel(), py.ravel() * 0.75], 1), k=2)
    edge = (d[:, 1] - d[:, 0]).reshape(h, w)
    cell = d[:, 0].reshape(h, w)
    lines = np.exp(-edge / 0.0022)
    shade = np.clip(cell / (np.percentile(cell, 95) + 1e-6), 0, 1)
    base = 0.80 + 0.17 * (1 - shade) ** 0.7  # sel cekung: terang di tengah, gelap ke tepi
    img = np.ones((h, w, 3), np.float32) * base[..., None]
    img = img * (1 - lines[..., None] * 0.85) + lines[..., None] * 0.85
    # lipatan kelopak lembut (gelap di tepi pita)
    fold = 0.5 + 0.5 * np.sin(ang * 3 + r * 9)
    img *= (0.94 + 0.06 * fold)[..., None]
    core = np.exp(-((r / 0.17) ** 2))
    img = img * (1 - core[..., None] * 0.55) + (COBALT * 0.9 + 0.1) * core[..., None] * 0.55 * (0.75 + 0.25 * lines[..., None])
    hot = np.exp(-((r / 0.07) ** 2))
    img = img * (1 - hot[..., None] * 0.6) + np.array([0.20, 0.30, 0.85]) * hot[..., None] * 0.6
    img = 0.85 * img + 0.15 * blur(img, 4)
    fade = np.clip((y - 0.70) / 0.30, 0, 1) ** 1.4
    img = img * (1 - fade[..., None]) + 1.0 * fade[..., None]
    finish(img, "fitur-bank-soal", grain=0.014)


# 3) Analisis skor — pita garis yang naik (seperti grafik 3D), mint → cobalt.
def art_analisis(w=1000, h=750):
    S = 2
    W, H = w * S, h * S
    img = np.ones((H, W, 3), np.float32) * 0.955
    # Semua garis digambar ke satu kanvas uint8 (cepat), lalu dicampur sekali.
    lines = np.zeros((H, W, 3), np.uint8)
    alpha = np.zeros((H, W), np.uint8)
    n = 70
    xs = np.linspace(-0.05, 1.05, 400)
    for i in range(n):
        t = i / (n - 1)
        base = 0.78 - 0.42 * np.clip(xs, 0, None) ** 1.4  # tren naik
        wave = 0.05 * np.sin(xs * 7 + t * 2.4) + 0.025 * np.sin(xs * 17 + t * 5)
        ys = base + wave + (t - 0.5) * 0.30 * (0.4 + xs)
        pts = np.stack([xs * W, ys * H], 1).astype(np.int32)
        col = (MINT * (1 - t) + COBALT * t) * 255
        a = int(255 * (0.25 + 0.55 * np.sin(np.pi * t)))
        cv2.polylines(lines, [pts], False, col.tolist(), max(1, S), cv2.LINE_AA)
        cv2.polylines(alpha, [pts], False, a, max(1, S), cv2.LINE_AA)
    lf = lines.astype(np.float32) / 255
    af = (alpha.astype(np.float32) / 255)[..., None]
    img = img * (1 - af) + lf * af
    glow = lf * 0.12
    img = np.clip(img + blur(glow, 14 * S) * 0.9, 0, 1)
    x, y = grid(W, H)
    # titik puncak
    cv2.circle(img, (int(W * 0.86), int(H * 0.40)), 14 * S, COBALT.tolist(), -1, cv2.LINE_AA)
    cv2.circle(img, (int(W * 0.86), int(H * 0.40)), 26 * S, (1, 1, 1), 3 * S, cv2.LINE_AA)
    fog = np.clip(1 - y / 0.25, 0, 1) ** 2
    img = img * (1 - fog[..., None] * 0.6) + GHOST * fog[..., None] * 0.6
    fade = np.clip((y - 0.72) / 0.28, 0, 1) ** 1.4
    img = img * (1 - fade[..., None]) + fade[..., None]
    img = cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA)
    finish(img, "fitur-analisis", grain=0.012)


# 4) Pembahasan — bola kaca bercahaya dengan cincin refraksi (simbol "paham").
def art_pembahasan(w=1000, h=750):
    x, y = grid(w, h)
    xa = (x - 0.5) * w / h + 0.5
    img = np.ones((h, w, 3), np.float32)
    bg = 0.93 + 0.05 * (1 - y)
    img *= bg[..., None]
    cx, cy, R = 0.5, 0.50, 0.30
    dx, dy = xa - cx, y - cy
    r = np.sqrt(dx**2 + dy**2) / R
    inside = np.clip((1 - r) * 60, 0, 1)
    # bayangan lunak di bawah bola
    sh = np.exp(-(((xa - cx) / 0.32) ** 2 + ((y - (cy + R * 1.02)) / 0.035) ** 2))
    img *= (1 - 0.18 * sh)[..., None]
    nz = np.sqrt(np.clip(1 - r**2, 0, 1))
    # isi bola: gradien cobalt → putih + cincin interferensi
    body = COBALT * (0.55 + 0.45 * (dy / R + 1) / 2)[..., None] * 0.55 + 0.45
    rings = 0.5 + 0.5 * np.cos(r * 22 - nz * 6)
    body = body * (0.92 + 0.08 * rings[..., None])
    mint_edge = np.exp(-(((r - 0.92) / 0.06) ** 2)) * np.clip(dy / R + 0.6, 0, 1)
    body = body * (1 - mint_edge[..., None] * 0.5) + MINT * mint_edge[..., None] * 0.5
    fres = np.clip(r, 0, 1) ** 3
    body = body * (1 - fres[..., None] * 0.35) + fres[..., None] * 0.35
    spec = np.exp(-(((dx / R + 0.35) / 0.22) ** 2 + ((dy / R + 0.42) / 0.12) ** 2))
    body = body + spec[..., None] * 0.65
    img = img * (1 - inside[..., None]) + body * inside[..., None]
    # halo cahaya
    halo = np.exp(-((np.clip(r - 1, 0, None) / 0.25) ** 2)) * (r > 1)
    img = img * (1 - halo[..., None] * 0.18) + COBALT * halo[..., None] * 0.18
    img = 0.8 * img + 0.2 * blur(img, 3)
    fade = np.clip((y - 0.74) / 0.26, 0, 1) ** 1.4
    img = img * (1 - fade[..., None]) + fade[..., None]
    finish(np.clip(img, 0, 1), "fitur-pembahasan", grain=0.012)


# 5) Live Group Chat — gelembung obrolan melayang (masuk: putih, keluar: cobalt), depth of field.
def art_groupchat(w=1000, h=750):
    S = 2
    W, H = w * S, h * S
    x, y = grid(W, H)
    img = np.ones((H, W, 3), np.float32) * (0.935 + 0.04 * (1 - y))[..., None]
    WHITE = np.array([1.0, 1.0, 1.0])
    MISTL = np.array([0.80, 0.83, 0.86])

    def rrect(mask, x0, y0, x1, y1, r, val=1.0):
        r = int(min(r, (x1 - x0) / 2, (y1 - y0) / 2))
        cv2.rectangle(mask, (x0 + r, y0), (x1 - r, y1), val, -1, cv2.LINE_AA)
        cv2.rectangle(mask, (x0, y0 + r), (x1, y1 - r), val, -1, cv2.LINE_AA)
        for cx, cy in ((x0 + r, y0 + r), (x1 - r, y0 + r), (x0 + r, y1 - r), (x1 - r, y1 - r)):
            cv2.circle(mask, (cx, cy), r, val, -1, cv2.LINE_AA)

    def bubble(cx, cy, bw, bh, side, col, sigma, lines=3, line_col=None, shadow=0.10, alpha=1.0):
        """Gelembung + ekor + baris teks samar, dikomposit dengan blur sesuai kedalaman."""
        nonlocal img
        x0, y0 = int((cx - bw / 2) * W), int((cy - bh / 2) * H)
        x1, y1 = int((cx + bw / 2) * W), int((cy + bh / 2) * H)
        r = int(min(x1 - x0, y1 - y0) * 0.42)
        m = np.zeros((H, W), np.float32)
        rrect(m, x0, y0, x1, y1, r)
        # ekor membulat di sudut bawah (kiri untuk pesan masuk, kanan untuk pesan keluar)
        ex, d = (x0, 1) if side == "L" else (x1, -1)
        tail = np.array([[ex + d * r * 0.15, y1 - r * 0.95], [ex - d * r * 0.28, y1 + r * 0.10], [ex + d * r * 0.95, y1 - r * 0.08]], np.int32)
        cv2.fillPoly(m, [tail], 1.0, cv2.LINE_AA)
        # bayangan lunak (datar: sangat tipis)
        sh = blur(np.roll(m, int(0.012 * H), 0), sigma + 14 * S) * shadow
        img = img * (1 - sh[..., None])
        a = blur(m, sigma)[..., None] * alpha
        img = img * (1 - a) + col * a
        if lines:
            t = np.zeros((H, W), np.float32)
            lh = max(4, int((y1 - y0) * 0.11))
            pad_x = int((x1 - x0) * 0.13)
            gap = (y1 - y0 - 2 * int((y1 - y0) * 0.22)) / max(1, lines - 1) if lines > 1 else 0
            for i in range(lines):
                ly = int(y0 + (y1 - y0) * 0.22 + i * gap) if lines > 1 else (y0 + y1) // 2
                frac = 1.0 if i < lines - 1 else 0.55
                lx1 = int(x0 + pad_x + (x1 - x0 - 2 * pad_x) * frac)
                rrect(t, x0 + pad_x, ly - lh // 2, lx1, ly + lh // 2, lh // 2)
            ta = blur(t, sigma)[..., None] * alpha * 0.55
            lc = line_col if line_col is not None else MISTL
            img = img * (1 - ta) + lc * ta

    # (cx, cy, w, h, sisi, warna, blur, baris, warna baris) — dari jauh (blur) ke dekat (tajam)
    far = 16 * S
    mid = 5 * S
    near = 0
    bubble(0.20, 0.13, 0.30, 0.11, "L", WHITE, far, 2)
    bubble(0.78, 0.20, 0.26, 0.10, "R", COBALT * 0.85 + 0.15, far, 2, WHITE)
    bubble(0.88, 0.62, 0.20, 0.09, "R", MINT * 0.75 + 0.25, far, 1, OBSIDIAN * 0.4 + 0.6)
    bubble(0.30, 0.34, 0.40, 0.14, "L", WHITE, mid, 3)
    bubble(0.66, 0.44, 0.40, 0.12, "R", COBALT, near, 2, WHITE, shadow=0.14)
    bubble(0.35, 0.60, 0.46, 0.15, "L", WHITE, near, 3, shadow=0.14)
    # indikator "sedang mengetik" (tiga titik) di gelembung kecil
    bubble(0.24, 0.80, 0.14, 0.08, "L", WHITE, mid, 0)
    for i, ox in enumerate((-0.035, 0.0, 0.035)):
        c = (COBALT * (0.55 + 0.2 * i) + (0.45 - 0.2 * i)).tolist()
        cv2.circle(img, (int((0.24 + ox) * W), int(0.80 * H)), int(0.012 * H), c, -1, cv2.LINE_AA)
    # cahaya cobalt lembut di tengah + kabut atas
    glow = np.exp(-(((x - 0.55) / 0.38) ** 2 + ((y - 0.52) / 0.30) ** 2))
    img = img * (1 - 0.06 * glow[..., None]) + COBALT * 0.06 * glow[..., None]
    fog = np.clip(1 - y / 0.22, 0, 1) ** 2
    img = img * (1 - fog[..., None] * 0.45) + GHOST * fog[..., None] * 0.45
    fade = np.clip((y - 0.74) / 0.26, 0, 1) ** 1.4
    img = img * (1 - fade[..., None]) + fade[..., None]
    img = cv2.resize(np.clip(img, 0, 1), (w, h), interpolation=cv2.INTER_AREA)
    finish(img, "fitur-groupchat", grain=0.012)


# ---------------------------------------------------------------------------
# Kanvas UI lembut (dipakai art_materi / art_progres / art_belajar) — gaya sama
# dengan art_groupchat: latar abu terang, kartu putih datar, aksen cobalt/mint,
# elemen jauh di-blur. Koordinat dalam pecahan lebar (x) / tinggi (y) kanvas;
# radius & ketebalan dalam pecahan tinggi. Konten penting dijaga di y 0.17–0.83
# karena kartu landing memotong gambar (object-cover, rasio ±1.9:1).
AMBER = np.array([245, 179, 1]) / 255
WHITE = np.array([1.0, 1.0, 1.0])
LINE = np.array([0.86, 0.88, 0.91])  # baris "teks" samar
LINE_DARK = np.array([0.74, 0.77, 0.81])  # baris judul/soal
SOFT = np.array([0.952, 0.958, 0.968])  # isi pill opsi


def tint(col, k):
    """Warna `col` dengan kekuatan k di atas putih (0 = putih, 1 = penuh)."""
    return np.asarray(col) * k + (1 - k)


def _rrect_px(mask, x0, y0, x1, y1, r, val=1.0):
    r = int(max(0, min(r, (x1 - x0) / 2, (y1 - y0) / 2)))
    cv2.rectangle(mask, (x0 + r, y0), (x1 - r, y1), val, -1, cv2.LINE_AA)
    cv2.rectangle(mask, (x0, y0 + r), (x1, y1 - r), val, -1, cv2.LINE_AA)
    for cx, cy in ((x0 + r, y0 + r), (x1 - r, y0 + r), (x0 + r, y1 - r), (x1 - r, y1 - r)):
        cv2.circle(mask, (cx, cy), r, val, -1, cv2.LINE_AA)


class Scene:
    def __init__(self, w=1000, h=750, S=2):
        self.w, self.h, self.S = w, h, S
        self.W, self.H = w * S, h * S
        self.x, self.y = grid(self.W, self.H)
        self.img = np.ones((self.H, self.W, 3), np.float32) * (0.935 + 0.04 * (1 - self.y))[..., None]

    def X(self, f):
        return int(round(f * self.W))

    def Y(self, f):
        return int(round(f * self.H))

    def empty(self):
        return np.zeros((self.H, self.W), np.float32)

    # --- mask ---
    def m_rrect(self, x0, y0, x1, y1, r=None):
        m = self.empty()
        if r is None:
            r = (y1 - y0) / 2
        _rrect_px(m, self.X(x0), self.Y(y0), self.X(x1), self.Y(y1), self.Y(r))
        return m

    def m_circle(self, cx, cy, r, thick=None):
        m = self.empty()
        t = -1 if thick is None else max(1, self.Y(thick))
        cv2.circle(m, (self.X(cx), self.Y(cy)), self.Y(r), 1.0, t, cv2.LINE_AA)
        return m

    def m_poly(self, pts, thick=None, closed=False):
        """Poligon terisi (thick=None) atau garis tebal dengan sambungan & ujung bulat."""
        m = self.empty()
        p = np.array([[self.X(a), self.Y(b)] for a, b in pts], np.int32)
        if thick is None:
            cv2.fillPoly(m, [p], 1.0, cv2.LINE_AA)
        else:
            t = max(1, self.Y(thick))
            cv2.polylines(m, [p], closed, 1.0, t, cv2.LINE_AA)
            for q in p:
                cv2.circle(m, tuple(int(v) for v in q), t // 2, 1.0, -1, cv2.LINE_AA)
        return m

    def rotate(self, m, deg, cx, cy):
        M = cv2.getRotationMatrix2D((self.X(cx), self.Y(cy)), deg, 1.0)
        return cv2.warpAffine(m, M, (self.W, self.H), flags=cv2.INTER_LINEAR)

    # --- komposit ---
    def shadow(self, m, strength=0.12, sigma=0):
        """Bayangan dua lapis: kontak tipis + ambien lebar (datar, sangat halus)."""
        S = self.S
        tight = blur(np.roll(m, self.Y(0.006), 0), sigma + 3 * S) * strength * 0.45
        wide = blur(np.roll(m, self.Y(0.022), 0), sigma + 22 * S) * strength
        self.img *= (1 - np.clip(tight + wide, 0, 0.6))[..., None]

    def paint(self, m, col, sigma=0, alpha=1.0):
        a = blur(m, sigma)[..., None] * alpha
        self.img = self.img * (1 - a) + np.asarray(col, np.float32) * a

    def card(self, x0, y0, x1, y1, r=0.045, col=WHITE, sigma=0, shadow=0.13, rot=0.0, alpha=1.0):
        m = self.m_rrect(x0, y0, x1, y1, r)
        if rot:
            m = self.rotate(m, rot, (x0 + x1) / 2, (y0 + y1) / 2)
        if shadow:
            self.shadow(m, shadow, sigma)
        self.paint(m, col, sigma, alpha)
        return m

    def pill(self, x0, y0, x1, y1, col, sigma=0, alpha=1.0, r=None):
        self.paint(self.m_rrect(x0, y0, x1, y1, r), col, sigma, alpha)

    def dot(self, cx, cy, r, col, sigma=0, alpha=1.0, thick=None):
        self.paint(self.m_circle(cx, cy, r, thick), col, sigma, alpha)

    def text(self, x0, y, widths, lh=0.016, gap=0.036, col=LINE, sigma=0, alpha=1.0):
        """Baris teks placeholder: `widths` = panjang tiap baris (pecahan lebar)."""
        m = self.empty()
        for i, wd in enumerate(widths):
            yy = y + i * gap
            _rrect_px(m, self.X(x0), self.Y(yy - lh / 2), self.X(x0 + wd), self.Y(yy + lh / 2), self.Y(lh / 2))
        self.paint(m, col, sigma, alpha)

    def done(self, name, glow=(0.55, 0.50), glow_k=0.06):
        x, y = self.x, self.y
        img = self.img
        g = np.exp(-(((x - glow[0]) / 0.40) ** 2 + ((y - glow[1]) / 0.32) ** 2))
        img = img * (1 - glow_k * g[..., None]) + COBALT * glow_k * g[..., None]
        fog = np.clip(1 - y / 0.16, 0, 1) ** 2
        img = img * (1 - fog[..., None] * 0.45) + GHOST * fog[..., None] * 0.45
        fade = np.clip((y - 0.84) / 0.16, 0, 1) ** 1.4
        img = img * (1 - fade[..., None]) + fade[..., None]
        img = cv2.resize(np.clip(img, 0, 1), (self.w, self.h), interpolation=cv2.INTER_AREA)
        finish(img, name, grain=0.012)


def _check(sc, cx, cy, s, col, thick):
    """Tanda centang berpusat di (cx, cy) dengan ukuran s (pecahan tinggi)."""
    k = sc.H / sc.W  # ubah satuan tinggi → pecahan lebar
    pts = [(cx - 0.42 * s * k, cy + 0.02 * s), (cx - 0.10 * s * k, cy + 0.32 * s), (cx + 0.45 * s * k, cy - 0.30 * s)]
    sc.paint(sc.m_poly(pts, thick), col)


def _star(sc, cx, cy, r, col):
    k = sc.H / sc.W
    pts = []
    for i in range(10):
        a = -np.pi / 2 + i * np.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + np.cos(a) * rr * k, cy + np.sin(a) * rr))
    sc.paint(sc.m_poly(pts), col)


# 6) Materi — tumpukan kartu soal (TWK/TIU/TKP) dengan 5 opsi A–E, satu terpilih.
def art_materi():
    sc = Scene()
    S = sc.S
    far, mid = 16 * S, 5 * S
    # elemen jauh (blur)
    sc.card(0.04, 0.12, 0.21, 0.26, 0.05, WHITE, far, 0.06)
    sc.pill(0.80, 0.14, 0.96, 0.22, tint(COBALT, 0.85), far)
    sc.pill(0.83, 0.62, 0.96, 0.69, tint(MINT, 0.75), far)
    sc.dot(0.10, 0.70, 0.035, tint(AMBER, 0.6), far)
    # kartu mini di kiri (mid)
    sc.card(0.06, 0.34, 0.22, 0.52, 0.04, WHITE, mid, 0.08)
    sc.pill(0.085, 0.38, 0.135, 0.41, tint(AMBER, 0.35), mid)
    sc.text(0.085, 0.45, [0.11, 0.07], 0.014, 0.04, LINE, mid)

    # kartu belakang (miring) — tiap kartu punya tab subtes sendiri
    def back(rot, tab_col, sigma, shade, tab_right):
        """Kartu di belakang, dikipas (diputar di sekitar titik bawah-tengah)."""
        x0, y0, x1, y1 = 0.30, 0.19, 0.72, 0.80
        cx, cy = (x0 + x1) / 2, 0.90
        m = sc.rotate(sc.m_rrect(x0, y0, x1, y1, 0.045), rot, cx, cy)
        sc.shadow(m, 0.10, sigma)
        sc.paint(m, WHITE * shade, sigma)
        tx = x1 - 0.035 - 0.08 if tab_right else x0 + 0.035
        tab = sc.rotate(sc.m_rrect(tx, 0.225, tx + 0.08, 0.262), rot, cx, cy)
        sc.paint(tab, tint(tab_col, 0.6), sigma)
        ln = sc.empty()
        for yy, wd in ((0.31, 0.34), (0.35, 0.34), (0.39, 0.20), (0.47, 0.34), (0.54, 0.34)):
            _rrect_px(ln, sc.X(x0 + 0.035), sc.Y(yy - 0.008), sc.X(x0 + 0.035 + wd), sc.Y(yy + 0.008), sc.Y(0.008))
        sc.paint(sc.rotate(ln, rot, cx, cy), LINE, sigma)

    back(9, AMBER, 2 * S, 0.975, False)
    back(-8, MINT, 1 * S, 0.99, True)

    # kartu depan
    x0, y0, x1, y1 = 0.285, 0.175, 0.715, 0.815
    sc.card(x0, y0, x1, y1, 0.045, WHITE, 0, 0.15)
    px = x0 + 0.038
    # tab subtes: TWK aktif (cobalt), TIU (amber), TKP (mint)
    ty0, ty1 = 0.225, 0.268
    sc.pill(px, ty0, px + 0.085, ty1, COBALT)
    sc.pill(px + 0.018, 0.2425, px + 0.067, 0.2505, WHITE, alpha=0.85)
    sc.pill(px + 0.095, ty0, px + 0.180, ty1, tint(AMBER, 0.22))
    sc.dot(px + 0.113, (ty0 + ty1) / 2, 0.0085, AMBER)
    sc.pill(px + 0.126, 0.2425, px + 0.165, 0.2505, tint(AMBER, 0.55))
    sc.pill(px + 0.190, ty0, px + 0.275, ty1, tint(MINT, 0.30))
    sc.dot(px + 0.208, (ty0 + ty1) / 2, 0.0085, MINT * 0.75)
    sc.pill(px + 0.221, 0.2425, px + 0.260, 0.2505, tint(MINT * 0.8, 0.6))
    # nomor soal (kanan atas)
    sc.pill(x1 - 0.038 - 0.06, ty0, x1 - 0.038, ty1, SOFT)
    sc.pill(x1 - 0.038 - 0.045, 0.2425, x1 - 0.038 - 0.015, 0.2505, LINE_DARK)
    # blok soal
    sc.text(px, 0.325, [0.345, 0.345, 0.21], 0.019, 0.042, LINE_DARK)
    # 5 opsi A–E, opsi C terpilih
    oy, oh, og = 0.465, 0.056, 0.013
    widths = [0.20, 0.25, 0.17, 0.22, 0.15]
    for i in range(5):
        a, b = oy + i * (oh + og), oy + i * (oh + og) + oh
        cy = (a + b) / 2
        sel = i == 2
        sc.pill(px, a, x1 - 0.038, b, COBALT if sel else SOFT, r=oh * 0.5)
        bx = px + 0.028
        if sel:
            sc.dot(bx, cy, 0.017, WHITE)
            sc.dot(bx, cy, 0.0085, COBALT)
            sc.pill(bx + 0.032, cy - 0.0075, bx + 0.032 + widths[i], cy + 0.0075, WHITE, alpha=0.75)
        else:
            sc.dot(bx, cy, 0.017, WHITE)
            sc.dot(bx, cy, 0.017, tint(np.array([0.76, 0.81, 0.84]), 1), thick=0.004)
            sc.pill(bx + 0.032, cy - 0.0075, bx + 0.032 + widths[i], cy + 0.0075, LINE)
    sc.done("fitur-materi", glow=(0.50, 0.55))


# 7) Progres — kartu grafik skor naik (bar + garis cobalt) dan kartu peringkat (podium mint, medali #1).
def art_progres():
    sc = Scene()
    S = sc.S
    far, mid = 16 * S, 5 * S
    sc.pill(0.74, 0.11, 0.94, 0.19, tint(COBALT, 0.85), far)
    sc.card(0.03, 0.10, 0.20, 0.22, 0.05, WHITE, far, 0.05)
    sc.pill(0.03, 0.80, 0.17, 0.87, tint(MINT, 0.7), far)
    sc.dot(0.94, 0.86, 0.03, tint(COBALT, 0.4), far)

    # kartu grafik
    x0, y0, x1, y1 = 0.075, 0.185, 0.625, 0.805
    sc.card(x0, y0, x1, y1, 0.045, WHITE, 0, 0.14)
    px = x0 + 0.04
    sc.dot(px + 0.022, 0.255, 0.029, tint(COBALT, 0.14))
    sc.dot(px + 0.022, 0.255, 0.011, COBALT)
    sc.text(px + 0.055, 0.240, [0.15, 0.09], 0.017, 0.033, LINE_DARK)
    # chip tren naik (mint) di kanan atas
    cx0, cx1 = x1 - 0.04 - 0.105, x1 - 0.04
    sc.pill(cx0, 0.228, cx1, 0.282, tint(MINT, 0.42))
    _arr = [(cx0 + 0.020, 0.266), (cx0 + 0.035, 0.250), (cx0 + 0.045, 0.258), (cx0 + 0.060, 0.241)]
    sc.paint(sc.m_poly(_arr, 0.0065), OBSIDIAN * 0.6 + 0.15)
    sc.paint(sc.m_poly([(cx0 + 0.050, 0.240), (cx0 + 0.061, 0.240), (cx0 + 0.061, 0.252)], 0.0065), OBSIDIAN * 0.6 + 0.15)
    sc.pill(cx0 + 0.072, 0.2505, cx1 - 0.016, 0.2595, OBSIDIAN * 0.5 + 0.35, alpha=0.6)
    # area plot
    gx0, gx1, gt, gb = px, x1 - 0.04, 0.37, 0.735
    grid_m = sc.empty()
    for k in range(4):
        yy = gt + k * (gb - gt) / 3
        _rrect_px(grid_m, sc.X(gx0), sc.Y(yy) - S, sc.X(gx1), sc.Y(yy) + S, S)
    sc.paint(grid_m, np.array([0.93, 0.94, 0.955]))
    vals = [0.22, 0.34, 0.30, 0.47, 0.43, 0.62, 0.80]
    n = len(vals)
    slot = (gx1 - gx0) / n
    bw = slot * 0.52
    tops = []
    for i, v in enumerate(vals):
        cx = gx0 + slot * (i + 0.5)
        top = gb - v * (gb - gt)
        last = i == n - 1
        m = sc.m_rrect(cx - bw / 2, top, cx + bw / 2, gb + 0.02, 0.014)
        m[sc.Y(gb):, :] = 0  # potong sudut bawah → dasar rata
        sc.paint(m, COBALT if last else tint(COBALT, 0.16 + 0.03 * i))
        tops.append((cx, top))
    # garis tren (smooth) di atas batang
    line_pts = [(cx, t - 0.045) for cx, t in tops]
    xs = np.array([p[0] for p in line_pts])
    ys = np.array([p[1] for p in line_pts])
    tt = np.linspace(0, n - 1, 200)
    # interpolasi Catmull-Rom sederhana
    def cr(arr, t):
        i = np.clip(np.floor(t).astype(int), 0, n - 2)
        u = t - i
        p0 = arr[np.clip(i - 1, 0, n - 1)]
        p1, p2 = arr[i], arr[i + 1]
        p3 = arr[np.clip(i + 2, 0, n - 1)]
        return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u**2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u**3)
    curve = list(zip(cr(xs, tt), cr(ys, tt)))
    sc.paint(blur(sc.m_poly(curve, 0.02), 8 * S), COBALT, alpha=0.18)
    sc.paint(sc.m_poly(curve, 0.0085), COBALT)
    for i, (cx, cy) in enumerate(line_pts[:-1]):
        sc.dot(cx, cy, 0.011, WHITE)
        sc.dot(cx, cy, 0.011, COBALT, thick=0.006)
    hx, hy = line_pts[-1]
    sc.paint(blur(sc.m_circle(hx, hy, 0.05), 6 * S), COBALT, alpha=0.20)
    sc.dot(hx, hy, 0.024, WHITE)
    sc.dot(hx, hy, 0.016, COBALT)
    # kartu peringkat
    rx0, ry0, rx1, ry1 = 0.585, 0.295, 0.925, 0.785
    sc.card(rx0, ry0, rx1, ry1, 0.045, WHITE, 0, 0.17)
    mx = (rx0 + rx1) / 2
    base = 0.735
    # podium: 2 – 1 – 3
    pw = 0.078
    pods = [(mx - pw * 1.08, 0.600, tint(MINT, 0.38)), (mx, 0.540, MINT), (mx + pw * 1.08, 0.640, tint(MINT, 0.22))]
    for cx, top, col in pods:
        m = sc.m_rrect(cx - pw / 2, top, cx + pw / 2, base + 0.03, 0.016)
        m[sc.Y(base):, :] = 0
        sc.paint(m, col)
    sc.pill(rx0 + 0.035, base - 0.003, rx1 - 0.035, base + 0.006, np.array([0.90, 0.92, 0.94]))
    # avatar kecil di atas podium 2 & 3
    sc.dot(pods[0][0], pods[0][1] - 0.040, 0.026, tint(COBALT, 0.18))
    sc.dot(pods[0][0], pods[0][1] - 0.040, 0.011, tint(COBALT, 0.5))
    sc.dot(pods[2][0], pods[2][1] - 0.040, 0.026, np.array([0.91, 0.93, 0.95]))
    sc.dot(pods[2][0], pods[2][1] - 0.040, 0.011, np.array([0.78, 0.82, 0.86]))
    # medali #1 di atas podium tengah (pita + lingkaran cobalt + bintang)
    my, mr = 0.445, 0.050
    k = sc.H / sc.W
    rib_l = [(mx - 0.040 * k, my - 0.120), (mx - 0.005 * k, my - 0.120), (mx + 0.020 * k, my - 0.020), (mx - 0.018 * k, my - 0.020)]
    rib_r = [(mx + 0.040 * k, my - 0.120), (mx + 0.005 * k, my - 0.120), (mx - 0.020 * k, my - 0.020), (mx + 0.018 * k, my - 0.020)]
    sc.paint(sc.m_poly(rib_l), tint(COBALT, 0.35))
    sc.paint(sc.m_poly(rib_r), tint(COBALT, 0.55))
    sc.shadow(sc.m_circle(mx, my, mr), 0.10)
    sc.dot(mx, my, mr, COBALT)
    sc.dot(mx, my, mr * 0.78, WHITE, thick=0.004, alpha=0.35)
    _star(sc, mx, my + 0.002, mr * 0.50, WHITE)
    sc.done("fitur-progres", glow=(0.55, 0.50))


# 8) Belajar — kartu jawaban (opsi benar mint + centang) dan panel pembahasan (ikon lampu cobalt).
def art_belajar():
    sc = Scene()
    S = sc.S
    far, mid = 16 * S, 5 * S
    RED = np.array([229, 72, 77]) / 255
    sc.card(0.70, 0.08, 0.92, 0.20, 0.05, WHITE, far, 0.05)
    sc.pill(0.04, 0.12, 0.20, 0.20, tint(COBALT, 0.8), far)
    sc.pill(0.02, 0.82, 0.16, 0.89, tint(MINT, 0.7), far)
    sc.dot(0.95, 0.88, 0.03, tint(COBALT, 0.45), far)

    # kartu jawaban (kiri)
    x0, y0, x1, y1 = 0.065, 0.195, 0.505, 0.795
    sc.card(x0, y0, x1, y1, 0.045, WHITE, 0, 0.13)
    px = x0 + 0.038
    sc.pill(px, 0.235, px + 0.085, 0.276, tint(COBALT, 0.13))
    sc.dot(px + 0.019, 0.2555, 0.0085, COBALT)
    sc.pill(px + 0.032, 0.2515, px + 0.068, 0.2595, tint(COBALT, 0.5))
    sc.text(px, 0.330, [0.355, 0.355, 0.22], 0.019, 0.042, LINE_DARK)
    oy, oh, og = 0.465, 0.058, 0.016
    widths = [0.18, 0.23, 0.16, 0.20]
    ox1 = x1 - 0.038
    for i in range(4):
        a, b = oy + i * (oh + og), oy + i * (oh + og) + oh
        cy = (a + b) / 2
        bx = px + 0.029
        if i == 1:  # jawaban benar
            sc.paint(blur(sc.m_rrect(px, a, ox1, b), 7 * S), MINT, alpha=0.35)
            sc.pill(px, a, ox1, b, MINT)
            sc.dot(bx, cy, 0.0205, OBSIDIAN)
            _check(sc, bx, cy, 0.020, MINT, 0.0055)
            sc.pill(bx + 0.034, cy - 0.0075, bx + 0.034 + widths[i], cy + 0.0075, OBSIDIAN, alpha=0.28)
        elif i == 3:  # pilihan peserta yang keliru (merah sangat lembut)
            sc.pill(px, a, ox1, b, tint(RED, 0.08))
            sc.dot(bx, cy, 0.018, WHITE)
            sc.dot(bx, cy, 0.018, tint(RED, 0.55), thick=0.004)
            sc.pill(bx + 0.034, cy - 0.0075, bx + 0.034 + widths[i], cy + 0.0075, tint(RED, 0.22))
        else:
            sc.pill(px, a, ox1, b, SOFT)
            sc.dot(bx, cy, 0.018, WHITE)
            sc.dot(bx, cy, 0.018, np.array([0.76, 0.81, 0.84]), thick=0.004)
            sc.pill(bx + 0.034, cy - 0.0075, bx + 0.034 + widths[i], cy + 0.0075, LINE)

    # panel pembahasan (kanan, menumpuk)
    qx0, qy0, qx1, qy1 = 0.455, 0.255, 0.935, 0.815
    sc.card(qx0, qy0, qx1, qy1, 0.045, WHITE, 0, 0.18)
    sc.pill(qx0 + 0.016, qy0 + 0.07, qx0 + 0.023, qy1 - 0.07, tint(COBALT, 0.85), r=0.004)  # aksen kiri
    qx = qx0 + 0.048
    # ikon lampu dalam kotak cobalt
    k = sc.H / sc.W
    isz = 0.105  # tinggi kotak ikon
    ix0, iy0 = qx, qy0 + 0.05
    ix1, iy1 = ix0 + isz * k, iy0 + isz
    sc.paint(blur(sc.m_rrect(ix0, iy0 + 0.01, ix1, iy1 + 0.01, 0.03), 8 * S), COBALT, alpha=0.25)
    sc.pill(ix0, iy0, ix1, iy1, COBALT, r=0.03)
    icx, icy = (ix0 + ix1) / 2, (iy0 + iy1) / 2
    sc.dot(icx, icy - 0.010, 0.026, WHITE)
    sc.paint(sc.m_poly([(icx - 0.013 * k, icy + 0.004), (icx + 0.013 * k, icy + 0.004), (icx + 0.009 * k, icy + 0.026), (icx - 0.009 * k, icy + 0.026)]), WHITE)
    sc.pill(icx - 0.010 * k, icy + 0.030, icx + 0.010 * k, icy + 0.037, WHITE, alpha=0.9)
    sc.dot(icx, icy - 0.010, 0.010, COBALT, alpha=0.35)
    # sinar kecil
    for ang in (-150, -90, -30):
        a = np.deg2rad(ang)
        r0, r1 = 0.036, 0.044
        sc.paint(sc.m_poly([(icx + np.cos(a) * r0 * k, icy - 0.010 + np.sin(a) * r0), (icx + np.cos(a) * r1 * k, icy - 0.010 + np.sin(a) * r1)], 0.004), WHITE, alpha=0.9)
    # judul panel
    tx = ix1 + 0.025
    sc.pill(tx, iy0 + 0.022, tx + 0.17, iy0 + 0.042, tint(COBALT, 0.55))
    sc.pill(tx, iy0 + 0.064, tx + 0.11, iy0 + 0.079, LINE)
    # baris kunci jawaban (chip mint + centang)
    ky = iy1 + 0.065
    sc.pill(qx, ky - 0.026, qx + 0.155, ky + 0.026, tint(MINT, 0.35))
    sc.dot(qx + 0.024, ky, 0.0155, MINT * 0.85)
    _check(sc, qx + 0.024, ky, 0.015, OBSIDIAN, 0.0045)
    sc.pill(qx + 0.046, ky - 0.0065, qx + 0.130, ky + 0.0065, OBSIDIAN, alpha=0.25)
    # teks penjelasan + satu frasa yang di-highlight
    tw = qx1 - 0.048 - qx
    ty = ky + 0.078
    sc.text(qx, ty, [tw, tw * 0.94, tw, tw * 0.62], 0.016, 0.040, LINE)
    sc.pill(qx + tw * 0.30, ty + 0.040 - 0.016, qx + tw * 0.74, ty + 0.040 + 0.016, tint(COBALT, 0.10))
    sc.pill(qx + tw * 0.33, ty + 0.040 - 0.008, qx + tw * 0.71, ty + 0.040 + 0.008, tint(COBALT, 0.45))
    sc.done("fitur-belajar", glow=(0.55, 0.52))


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    import sys

    only = set(sys.argv[1:])
    for name, fn in [
        ("tryout", art_tryout),
        ("bank", art_bank),
        ("analisis", art_analisis),
        ("pembahasan", art_pembahasan),
        ("groupchat", art_groupchat),
        ("materi", art_materi),
        ("progres", art_progres),
        ("belajar", art_belajar),
    ]:
        if not only or name in only:
            fn()
