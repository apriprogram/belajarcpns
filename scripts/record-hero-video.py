"""
Rekam video tutorial untuk hero landing page: daftar akun -> pilih tryout -> simulasi ujian CBT.

Prasyarat: aplikasi berjalan (docker compose up -d), Python + Playwright (chromium).
    python scripts/record-hero-video.py [BASE_URL] [--no-caption]

Hasil: apps/web/public/video/tutorial.webm (+ tutorial-poster.jpg bila opencv tersedia).
Akun peserta baru dibuat setiap kali skrip dijalankan — hapus lewat admin (DELETE /api/admin/users/:id) setelah merekam.
Hasil: apps/web/public/video/tutorial-2.webm (+ tutorial-2-poster.jpg).
"""
import os
import random
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
BASE = (ARGS[0] if ARGS else "http://localhost:3000").rstrip("/")
# --no-caption: tanpa teks langkah di video (hero menampilkan chip langkah sendiri)
SHOW_CAPTION = "--no-caption" not in sys.argv
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "apps" / "web" / "public" / "video"
W, H = 1280, 800

# Kursor palsu + teks langkah (video Playwright tidak merekam kursor asli).
OVERLAY_JS = r"""
(() => {
  const boot = () => {
    if (document.getElementById('__cur')) return;
    const st = document.createElement('style');
    st.textContent = `
      #__cur{position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;
        transform:translate(-100px,-100px);transition:transform .05s linear}
      #__cur svg{filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
      .__rip{position:fixed;width:36px;height:36px;margin:-18px 0 0 -18px;border-radius:50%;z-index:2147483646;
        pointer-events:none;background:rgba(55,101,246,.35);animation:__r .5s ease-out forwards}
      @keyframes __r{from{transform:scale(.3);opacity:1}to{transform:scale(1.6);opacity:0}}
      #__cap{position:fixed;left:50%;bottom:28px;z-index:2147483645;pointer-events:none;
        transform:translate(-50%,20px);opacity:0;transition:all .35s cubic-bezier(.2,.8,.2,1);
        display:flex;align-items:center;gap:10px;padding:10px 22px 10px 10px;border-radius:999px;
        background:rgba(24,29,37,.88);color:#fff;font:600 19px/1.2 Inter,system-ui,sans-serif;
        backdrop-filter:blur(12px)}
      #__cap.on{transform:translate(-50%,0);opacity:1}
      #__cap b{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;
        background:#70FC8E;color:#181D25;font:700 13px ui-monospace,monospace}`;
    document.head.appendChild(st);
    const c = document.createElement('div');
    c.id = '__cur';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.6L9.6 20z" fill="#181D25" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    const cap = document.createElement('div');
    cap.id = '__cap';
    document.body.appendChild(cap);
    const pos = JSON.parse(sessionStorage.getItem('__pos') || '[-100,-100]');
    c.style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
    addEventListener('mousemove', (e) => {
      c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
      sessionStorage.setItem('__pos', JSON.stringify([e.clientX, e.clientY]));
    }, true);
    addEventListener('mousedown', (e) => {
      const r = document.createElement('div');
      r.className = '__rip'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
      document.body.appendChild(r); setTimeout(() => r.remove(), 600);
    }, true);
    const saved = sessionStorage.getItem('__capText');
    if (saved) { cap.innerHTML = saved; cap.classList.add('on'); }
  };
  window.__caption = (n, text) => {
    const html = text ? `<b>${n}</b>${text}` : '';
    sessionStorage.setItem('__capText', html);
    const cap = document.getElementById('__cap');
    if (!cap) return;
    if (!text) { cap.classList.remove('on'); return; }
    cap.classList.remove('on');
    setTimeout(() => { cap.innerHTML = html; cap.classList.add('on'); }, 180);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
"""

mouse = [W // 2, H // 2]


def glide(page, locator, click=True, pause=0.35):
    """Gerakkan kursor perlahan ke tengah elemen lalu klik."""
    locator.scroll_into_view_if_needed()
    # Tunggu scroll halus selesai sampai posisi elemen stabil.
    box = locator.bounding_box()
    for _ in range(20):
        time.sleep(0.08)
        nxt = locator.bounding_box()
        if nxt == box:
            break
        box = nxt
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    steps = max(12, int(((x - mouse[0]) ** 2 + (y - mouse[1]) ** 2) ** 0.5 / 18))
    page.mouse.move(x, y, steps=steps)
    mouse[0], mouse[1] = x, y
    time.sleep(pause)
    if click:
        # locator.click mengukur ulang posisi: blur input sebelumnya bisa menggeser layout.
        locator.click()


CHAPTERS = []
CLOCK = {"t0": 0.0, "lead": 0.0}


def caption(page, n, text):
    CHAPTERS.append((n, text, round(time.time() - CLOCK["t0"] - CLOCK["lead"], 1)))
    if not SHOW_CAPTION:
        return
    page.evaluate("([n,t]) => window.__caption && window.__caption(n,t)", [n, text])


def type_into(page, locator, text, delay=55):
    glide(page, locator)
    page.keyboard.type(text, delay=delay)
    # Blur dulu: pesan validasi yang muncul saat blur menggeser layout di tengah klik berikutnya.
    page.evaluate("document.activeElement && document.activeElement.blur()")
    time.sleep(0.35)


def main():
    tmp = Path(tempfile.mkdtemp(prefix="bisapns-rec-"))
    stamp = int(time.time())
    email = f"rina.lestari{stamp % 10000}@gmail.com"
    phone = "0812" + "".join(random.choice("0123456789") for _ in range(8))
    password = "Latihan" + str(random.randint(1000, 9999)) + "!"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        ctx = browser.new_context(
            viewport={"width": W, "height": H},
            device_scale_factor=1,
            record_video_dir=str(tmp),
            record_video_size={"width": W, "height": H},
            locale="id-ID",
            timezone_id="Asia/Jakarta",
        )
        ctx.add_init_script(OVERLAY_JS)
        # Sembunyikan widget mengambang (GroupChat, tombol ke atas) agar video bersih.
        ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='[aria-label^=\"Buka GroupChat\"],[title=\"Kembali ke atas\"],nextjs-portal{display:none!important}';document.head.appendChild(s)})")
        page = ctx.new_page()
        t0 = CLOCK["t0"] = time.time()

        # ---------- 1. Daftar ----------
        page.goto(f"{BASE}/daftar", wait_until="networkidle")
        page.mouse.move(*mouse)
        lead = CLOCK["lead"] = time.time() - t0  # potong frame kosong sebelum halaman tampil
        caption(page, "1", "Buat akun gratis")
        time.sleep(1.2)
        type_into(page, page.get_by_placeholder("Nama lengkap"), "Rina Lestari")
        type_into(page, page.get_by_placeholder("nama@email.com"), email, delay=35)
        type_into(page, page.get_by_placeholder("08xxxxxxxxxx"), phone, delay=45)
        glide(page, page.get_by_role("radio", name="Perempuan"))
        time.sleep(0.3)
        type_into(page, page.get_by_placeholder("Buat kata sandi"), password, delay=45)
        type_into(page, page.get_by_placeholder("Ulangi kata sandi"), password, delay=45)
        glide(page, page.get_by_role("checkbox"))
        time.sleep(0.5)
        glide(page, page.locator("form button[type=submit]"))
        page.wait_for_url("**/dashboard**", timeout=45000)
        page.wait_for_load_state("networkidle")

        # ---------- 2. Pilih tryout ----------
        caption(page, "2", "Masuk dashboard & pilih tryout")
        time.sleep(2.2)
        glide(page, page.get_by_role("link", name="Tryout").first)
        page.wait_for_url("**/tryout", timeout=45000)
        page.wait_for_load_state("networkidle")
        time.sleep(1.4)
        glide(page, page.get_by_role("link", name="Mulai").first)
        page.wait_for_url("**/tryout/*", timeout=45000)
        page.wait_for_load_state("networkidle")
        time.sleep(1.2)
        glide(page, page.get_by_role("checkbox"))
        time.sleep(0.4)
        glide(page, page.get_by_role("button", name="Mulai ujian"))
        page.wait_for_url("**/ujian/**", timeout=45000)
        page.wait_for_selector('[role="radiogroup"]', timeout=45000)

        # ---------- 3. Simulasi ujian ----------
        caption(page, "3", "Kerjakan soal seperti CAT BKN")
        time.sleep(1.6)
        for i in range(6):
            opts = page.locator('[role="radiogroup"] [role="radio"]')
            glide(page, opts.nth(random.randint(0, opts.count() - 1)))
            time.sleep(0.6)
            if i in (2, 4):
                glide(page, page.get_by_role("button", name="Ragu-ragu", exact=True))
                time.sleep(0.5)
            if i == 3:
                caption(page, "3", "Tandai ragu-ragu, jawaban tersimpan otomatis")
            glide(page, page.get_by_role("button", name="Berikutnya", exact=True))
            time.sleep(0.7)

        caption(page, "4", "Lompat soal lewat panel nomor")
        time.sleep(0.6)
        glide(page, page.get_by_role("button", name="Soal 3,").first)
        time.sleep(1.2)

        caption(page, "5", "Kumpulkan & lihat skor")
        glide(page, page.get_by_role("button", name="Selesai ujian"))
        time.sleep(1.2)
        # Berhenti di dialog konfirmasi (jawaban acak tidak dikumpulkan agar skor demo tidak tampil).
        glide(page, page.get_by_role("button", name="Ya, kumpulkan"), click=False)
        time.sleep(2.4)

        video = page.video.path()
        ctx.close()
        browser.close()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / "tutorial-2.webm"
    ffmpeg = next(Path.home().glob("AppData/Local/ms-playwright/ffmpeg-*/ffmpeg*.exe"), None) or shutil.which("ffmpeg")
    if ffmpeg:
        subprocess.run([str(ffmpeg), "-y", "-loglevel", "error", "-ss", f"{lead:.2f}", "-i", str(video),
                        "-an", "-c:v", "libvpx", "-b:v", "900k", "-crf", "10", "-deadline", "good", str(out)], check=True)
    else:
        shutil.copyfile(video, out)
    for n, text, t in CHAPTERS:
        print(f"  {t:5.1f}s  [{n}] {text}")
    print(f"video: {out} ({out.stat().st_size // 1024} KB)")
    print(f"akun: {email}")

    try:
        import cv2

        cap = cv2.VideoCapture(str(out))
        n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, int(n * 0.55)) if n > 0 else 0)
        ok, frame = cap.read()
        if ok:
            cv2.imwrite(str(OUT_DIR / "tutorial-2-poster.jpg"), frame, [cv2.IMWRITE_JPEG_QUALITY, 82])
            print("poster: tutorial-2-poster.jpg")
    except ImportError:
        pass
    shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
