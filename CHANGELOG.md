# Changelog

Semua perubahan penting dicatat di sini. Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/) dan [SemVer](https://semver.org/lang/id/).

## [1.0.0] — 2026-10-12

Rilis awal BISA-PNS — platform latihan & tryout CBT SKD CPNS 2027.

### Ditambahkan
- **Autentikasi**: daftar, login, logout, refresh token, lupa/reset password; JWT access 15 menit + refresh 7 hari di cookie httpOnly; RBAC admin/peserta; rate limit login.
- **Panel peserta**: dashboard (kalender mingguan, jadwal ujian terdekat, grafik waktu belajar, gauge skor, target harian), latihan soal mode belajar dengan pembahasan langsung, daftar tryout, riwayat, profil.
- **Ruang ujian CBT**: timer server-side, autosave tiap jawaban, tandai ragu-ragu, panel nomor soal 4 status, pemulihan sesi, auto-submit saat waktu habis, acak soal/opsi, log pindah tab/blur.
- **Penilaian SKD**: TWK/TIU benar=5, TKP bobot 1–5; passing grade per subtes & total dapat dikonfigurasi; peringkat per paket; halaman hasil & pembahasan.
- **Panel admin**: dashboard statistik, bank soal (CRUD, kategori & sub-kategori, gambar, import/export CSV + template), paket ujian (manual/acak per komposisi, jadwal, passing grade, publish), manajemen peserta (detail, blokir, reset password, ekspor), laporan per paket & analisis butir soal, pengumuman, pengaturan, log aktivitas.
- **Design system** "Order. Balance. Clarity." (Tailwind token mint/cobalt/mist/ghost/obsidian) + halaman `/design-system`.
- **Infrastruktur**: Dockerfile multi-stage (API Go → Alpine, Web Next.js standalone non-root), `docker-compose.yml` (lokal), `docker-compose.prod.yml` (Caddy HTTPS otomatis + backup harian `pg_dump` retensi 14 hari), skrip `backup.sh`/`restore.sh`/`dev-up.ps1`/`dev-up.sh`.
- **Uji beban**: skenario k6 500 peserta serentak (`tests/load`).

### Backlog fase 2
Mode gelap, pembayaran/langganan, leaderboard, notifikasi email, aplikasi mobile.
