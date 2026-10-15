#!/usr/bin/env python3
"""
Kirim semua URL di sitemap ke IndexNow (Bing, Yandex, Seznam, Naver, ...; dipakai juga ChatGPT Search & Copilot
lewat indeks Bing). Lihat docs/SEO.md -> "IndexNow".

Kunci: file apps/web/public/<32-hex>.txt yang isinya sama dengan namanya (disajikan di https://domain/<kunci>.txt).

Contoh:
  python scripts/indexnow.py                                   # https://belajarcpns.web.id
  python scripts/indexnow.py --base https://belajarcpns.web.id
  python scripts/indexnow.py --dry-run --sitemap http://localhost:3000/sitemap.xml   # cek tanpa mengirim

Jalankan setelah deploy / setelah menerbitkan atau memperbarui panduan. Hanya pustaka standar Python.
"""
import argparse
import json
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "apps" / "web" / "public"
DEFAULT_BASE = "https://belajarcpns.web.id"
ENDPOINT = "https://api.indexnow.org/indexnow"
MAX_URLS = 10000  # batas IndexNow per permintaan
UA = "indexnow-submit/1.0 (+https://www.indexnow.org)"


def find_key():
    """Cari <key>.txt (8-128 karakter hex/alfanumerik-) di public/ yang isinya sama dengan namanya."""
    for f in sorted(PUBLIC.glob("*.txt")):
        name = f.stem
        if re.fullmatch(r"[A-Za-z0-9-]{8,128}", name) and f.read_text(encoding="utf-8").strip() == name:
            return name
    return None


def fetch_sitemap(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/xml,text/xml"})
    with urllib.request.urlopen(req, timeout=30) as res:
        data = res.read()
    root = ET.fromstring(data)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locs = [el.text.strip() for el in root.findall(".//sm:loc", ns) if el.text and el.text.strip()]
    # sitemap index -> ambil sitemap anak
    if root.tag.endswith("sitemapindex"):
        urls = []
        for child in locs:
            urls.extend(fetch_sitemap(child))
        return urls
    return locs


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description="Kirim URL sitemap ke IndexNow.")
    ap.add_argument("--base", default=DEFAULT_BASE, help=f"URL situs (default {DEFAULT_BASE})")
    ap.add_argument("--sitemap", help="URL sitemap (default <base>/sitemap.xml)")
    ap.add_argument("--key", help="kunci IndexNow (default: dicari di apps/web/public/<key>.txt)")
    ap.add_argument("--endpoint", default=ENDPOINT, help=f"endpoint IndexNow (default {ENDPOINT})")
    ap.add_argument("--dry-run", action="store_true", help="tampilkan payload tanpa mengirim")
    args = ap.parse_args()

    base = args.base.rstrip("/")
    host = urllib.parse.urlparse(base).netloc
    if not host:
        sys.exit(f"--base tidak valid: {args.base}")
    key = args.key or find_key()
    if not key:
        sys.exit(f"Kunci IndexNow tidak ditemukan di {PUBLIC} (file <key>.txt berisi kunci yang sama).")

    sitemap_url = args.sitemap or f"{base}/sitemap.xml"
    try:
        urls = fetch_sitemap(sitemap_url)
    except (urllib.error.URLError, ET.ParseError, OSError) as e:
        sys.exit(f"Gagal membaca sitemap {sitemap_url}: {e}")

    same_host = [u for u in urls if urllib.parse.urlparse(u).netloc == host]
    skipped = len(urls) - len(same_host)
    if skipped:
        print(f"Peringatan: {skipped} URL dilewati karena host-nya bukan {host}.")
    urls = list(dict.fromkeys(same_host))[:MAX_URLS]
    if not urls:
        sys.exit("Tidak ada URL untuk dikirim.")

    payload = {"host": host, "key": key, "keyLocation": f"{base}/{key}.txt", "urlList": urls}
    print(f"{len(urls)} URL dari {sitemap_url} untuk host {host}")
    if args.dry_run:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        print("Dry run: tidak ada yang dikirim.")
        return

    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        args.endpoint,
        data=body,
        method="POST",
        headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": UA},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            print(f"IndexNow: HTTP {res.status} {res.reason}")
    except urllib.error.HTTPError as e:
        hints = {
            400: "format salah",
            403: "kunci tidak valid / file kunci tidak bisa diakses di keyLocation",
            422: "URL bukan milik host atau kunci tidak cocok",
            429: "terlalu sering, coba lagi nanti",
        }
        sys.exit(f"IndexNow: HTTP {e.code} {e.reason} ({hints.get(e.code, 'lihat https://www.indexnow.org/documentation')})")
    except urllib.error.URLError as e:
        sys.exit(f"Gagal menghubungi {args.endpoint}: {e}")


if __name__ == "__main__":
    main()
