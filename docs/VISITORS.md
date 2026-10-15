# Statistik pengunjung

- **Pencatatan:** `components/analytics/VisitTracker.jsx` (dipasang di `Providers`) mengirim `POST /api/track` setiap pindah halaman
  (`navigator.sendBeacon`). Halaman `/admin` tidak dicatat; bot/crawler (User-Agent) diabaikan; Do Not Track dihormati.
- **Privasi:** IP tidak disimpan. Pengunjung unik = hash SHA-256 dari ID acak di `localStorage` browser.
- **Negara:** diambil dari header CDN/proxy (`CF-IPCountry` Cloudflare, `X-Vercel-IP-Country`, `CloudFront-Viewer-Country`,
  `X-Country-Code`). Tanpa header itu, diperkirakan dari bahasa browser (`Accept-Language`, mis. `id-ID` → ID); sisanya "Tidak diketahui".
  **Untuk produksi, pasang Cloudflare (proxy) di depan domain** agar negara akurat.
- **Data:** tabel `site_visits` (migrasi 0009). **Admin:** `GET /api/admin/visits/stats?granularity=harian|mingguan|bulanan|tahunan`
  → total / hari ini / kemarin / minggu ini / bulan ini / tahun ini (tayangan & pengunjung unik), tren, negara, halaman, perangkat, aktif 5 menit.
- **Tampilan:** `components/admin/VisitorStats.jsx` di atas dashboard admin. Semua waktu WIB.
