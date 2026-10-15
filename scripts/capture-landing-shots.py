"""
Ambil screenshot aplikasi (UI terbaru) untuk visual landing page & panel login.

Prasyarat: aplikasi berjalan + akun demo peserta1 (README → Akun demo) yang sudah punya hasil tryout.
    python scripts/capture-landing-shots.py [BASE_URL] [nama ...]

nama (opsional, default semua): daftar hasil pembahasan dashboard latihan ujian
Hasil: apps/web/public/landing/shot-<nama>.webp
"""
import sys
import time
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
BASE = (ARGS[0] if ARGS and ARGS[0].startswith("http") else "http://localhost:3000").rstrip("/")
ONLY = {a for a in ARGS if not a.startswith("http")}
OUT = Path(__file__).resolve().parents[1] / "apps" / "web" / "public" / "landing"
DEMO_EMAIL, DEMO_PASSWORD = "peserta1@bisapns.id", "Peserta123!"

HIDE_FLOATING = """
  [aria-label^="Buka GroupChat"], [title="Kembali ke atas"], nextjs-portal { display: none !important; }
  *, *::before, *::after { caret-color: transparent !important; }
"""


def want(name):
    return not ONLY or name in ONLY


def shot(page, name, clip=None, full=False, width=1600):
    """Screenshot → WEBP (lebar maks `width`) di public/landing/shot-<name>.webp."""
    time.sleep(1.4)
    png = OUT / f"shot-{name}.png"
    page.screenshot(path=str(png), clip=clip, full_page=full)
    im = Image.open(png).convert("RGB")
    w = 900 if name == "daftar" else width
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(OUT / f"shot-{name}.webp", "WEBP", quality=84, method=6)
    png.unlink()
    print("ok", name)


def box(page, selector, pad=0, aspect=None, max_h=None):
    """Kotak clip di sekitar elemen (opsional rasio lebar:tinggi)."""
    b = page.locator(selector).first.bounding_box()
    x, y, w = b["x"] - pad, b["y"] - pad, b["width"] + pad * 2
    h = w / aspect if aspect else b["height"] + pad * 2
    if max_h:
        h = min(h, max_h)
    return {"x": max(0, x), "y": max(0, y), "width": w, "height": h}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(viewport={"width": 1280, "height": 820}, device_scale_factor=2, locale="id-ID")
        ctx.add_init_script(f"document.addEventListener('DOMContentLoaded',()=>{{const s=document.createElement('style');s.textContent={HIDE_FLOATING!r};document.head.appendChild(s)}})")
        page = ctx.new_page()

        if want("daftar"):
            # Form daftar terisi (bagian atas form: nama, email, HP, jenis kelamin).
            page.goto(f"{BASE}/daftar", wait_until="networkidle")
            page.get_by_placeholder("Nama lengkap").fill("Rina Lestari")
            page.get_by_placeholder("nama@email.com").fill("rina.lestari@gmail.com")
            page.get_by_placeholder("08xxxxxxxxxx").fill("081234567890")
            page.get_by_role("radio", name="Perempuan").click()
            page.evaluate("document.activeElement && document.activeElement.blur()")
            shot(page, "daftar", clip=box(page, "form", pad=28, aspect=1.25))

        # Login demo.
        r = ctx.request.post(f"{BASE}/api/auth/login", data={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
        assert r.ok, r.text()

        if want("dashboard"):
            page.goto(f"{BASE}/dashboard", wait_until="networkidle")
            shot(page, "dashboard")

        if want("latihan"):
            page.goto(f"{BASE}/latihan", wait_until="networkidle")
            shot(page, "latihan")

        if want("hasil") or want("pembahasan"):
            # Hasil terbaik (skor tertinggi) supaya visual menunjukkan "Lulus".
            res = ctx.request.get(f"{BASE}/api/me/results").json()["data"]
            items = res if isinstance(res, list) else res.get("items", [])
            top = max(items, key=lambda r: r.get("score_total", 0), default=None)
            best = f"/hasil/{top['attempt_id']}" if top else None
            if best:
                page.goto(BASE + best, wait_until="networkidle")
                if want("hasil"):
                    shot(page, "hasil")
                if want("pembahasan"):
                    # Soal pertama yang punya penjelasan, rata atas di bawah navbar.
                    page.evaluate("""() => {
                      const p = [...document.querySelectorAll('li p')].find(e => e.textContent.trim() === 'Pembahasan');
                      const li = p && p.closest('li');
                      if (li) window.scrollTo(0, li.getBoundingClientRect().top + window.scrollY - 110);
                    }""")
                    shot(page, "pembahasan")

        if want("ujian"):
            page.goto(f"{BASE}/tryout", wait_until="networkidle")
            resume = page.locator('a[href^="/ujian/"]').first
            if resume.count():
                page.goto(BASE + resume.get_attribute("href"), wait_until="networkidle")
                page.wait_for_selector('[role="radiogroup"]', timeout=20000)
                page.locator('[role="radiogroup"] [role="radio"]').nth(1).click()
                shot(page, "ujian")
            else:
                print("lewati ujian (tidak ada sesi berjalan)")

        browser.close()


if __name__ == "__main__":
    main()
