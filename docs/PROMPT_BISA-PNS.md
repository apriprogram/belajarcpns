# PROMPT PEMBUATAN APLIKASI UJIAN CPNS 2027 — "BISA-PNS"

Cara pakai: jalankan **Prompt 0 (Konteks Global)** sekali di awal sesi, lalu jalankan **Prompt Tahap 1 → 5 secara berurutan**. Selesaikan dan uji tiap tahap sebelum lanjut. Simpan Prompt 0 sebagai `CLAUDE.md` di root repo agar konteks selalu terbawa.

---

## PROMPT 0 — KONTEKS GLOBAL (salin ke CLAUDE.md)

```
Kamu adalah senior full-stack engineer sekaligus product designer. Bangun aplikasi web "BISA-PNS": platform latihan dan ujian CBT (Computer Based Test) untuk persiapan Seleksi CPNS 2027 (SKD: TWK, TIU, TKP).

## STACK (WAJIB, JANGAN DIGANTI)
- Frontend: Next.js (App Router) + JavaScript/JSX (bukan TypeScript) + Tailwind CSS + CSS/JS murni untuk kebutuhan khusus
- Backend: Golang + Gin (REST API)
- Database: PostgreSQL (migrasi dengan golang-migrate, akses data dengan sqlx atau pgx; tanpa ORM berat)
- Auth: JWT access token (15 menit) + refresh token (7 hari) di cookie httpOnly, password di-hash argon2id/bcrypt
- Deploy lokal: Docker Compose (web, api, postgres)
- Monorepo:
  /apps/web   -> Next.js
  /apps/api   -> Go (cmd/api, internal/{auth,user,category,question,package,attempt,result,admin,announcement}, pkg/{middleware,response,validator,config}, migrations)
  /docker-compose.yml, /README.md, /.env.example

## KONSEP DESAIN: "Order. Balance. Clarity."
Tampilan rapi, proporsi seimbang, banyak ruang kosong, satu fokus per kartu, warna dikontrol ketat.

### Palet (jadikan design token di tailwind.config.js DAN CSS variables)
- Neon Mint   #70FC8E  -> sukses/lulus, progres selesai, highlight kecil. Teks di atasnya SELALU Obsidian.
- True Cobalt #3765F6  -> aksi utama, tautan, ring fokus, hari terpilih, garis grafik.
- Cool Mist   #C3CED7  -> border, divider, placeholder, track progres, ikon nonaktif.
- Ghost Grey  #F2F3F6  -> latar halaman.
- Obsidian    #181D25  -> teks utama, tombol CTA hitam, sidebar/header gelap.
- Putih #FFFFFF untuk latar kartu.
- Warna status (hanya untuk makna, bukan merek): merah #E5484D (error/waktu hampir habis), kuning #F5B301 (ragu-ragu/menunggu).
- Komposisi: ~80% netral, ~15% Cobalt, ~5% Mint. Jangan gunakan gradien warna-warni. Satu-satunya gradien: glow Cobalt sangat lembut di area header halaman utama.
- Pastikan kontras teks memenuhi WCAG AA.

### Tipografi
- Font: Inter (via next/font). Judul 600-700 dengan letter-spacing sedikit rapat, body 400-500.
- Angka statistik besar (40-56px) dengan `font-variant-numeric: tabular-nums`.
- Timer, nomor soal, kode peserta pakai font monospace (JetBrains Mono / ui-monospace).

### Bentuk & komponen (buat di /apps/web/components/ui, lengkap dengan variasi state)
- Card: radius 24-32px, putih, tanpa border tebal, shadow sangat halus, padding lega (24-32px). Grid 12 kolom, jarak kelipatan 4/8px.
- Chip/Pill metadata: latar tint lembut + ikon + teks berwarna (untuk tanggal, durasi, jumlah soal, mode ujian, jumlah peserta).
- Button: primer (Obsidian pill), aksen (Cobalt), sekunder (putih + border Cool Mist), ikon-bulat (40px) untuk aksi kecil (edit, menu, notifikasi). Ada state hover/focus/disabled/loading.
- Input: 5 state wajib -> disabled, default, focus (ring Cobalt), sukses, error (border merah + ikon + pesan, mis. "Oopss.. We can't find ..." versi Bahasa Indonesia).
- Badge status (pill tint): Lulus (Mint), Berlangsung (Cobalt), Menunggu (kuning), Tidak Lulus (merah), Draft (abu).
- Progress: bar bersegmen (seperti checklist) dan gauge setengah lingkaran (SVG) dengan angka besar di tengah.
- Chart: line chart sederhana (Cobalt, titik aktif dengan marker), bar chart. Gunakan Recharts atau SVG custom; tooltip bersih, tanpa dekorasi berlebih.
- Tabel: header abu muda, baris lega, badge status, menu aksi titik tiga, filter tab pill (Semua / Lulus / Gagal), ekspor CSV.
- Modal detail (mis. detail peserta): header ringkas + ringkasan statistik 4 kartu + tabel riwayat.
- Navbar/Topbar: tombol pill putih dengan ikon bulat (profil, notifikasi, pencarian, pengaturan) di atas latar Ghost Grey.
- Semua komponen responsif (mobile-first), aksesibel (label, aria, focus ring, navigasi keyboard).
- Mode gelap: BELUM sekarang (fase 2), tetapi susun token agar mudah ditambah.

## FITUR INTI

### Publik
Landing page, fitur, paket tryout, Login, Daftar (nama, email, no. HP, password + konfirmasi), Lupa/Reset password. Validasi form di klien dan server.

### Panel Peserta (/dashboard)
- Dashboard: kalender mingguan + jadwal ujian terdekat (kartu), grafik total waktu belajar vs kemarin, gauge progres/rata-rata skor, daftar target harian.
- Latihan Soal: filter TWK/TIU/TKP + sub-materi, mode belajar (jawab -> langsung lihat pembahasan).
- Tryout/Ujian: daftar paket (kartu + chip durasi/jumlah soal/jadwal/status), tombol Mulai/Lanjutkan.
- Ruang Ujian CBT (lihat spesifikasi di bawah).
- Hasil & Pembahasan: skor per subtes, status vs passing grade, peringkat, pembahasan tiap soal.
- Riwayat ujian (tabel), Profil (ubah data & password).

### Panel Admin (/admin)
- Dashboard: total peserta, ujian aktif, total soal, rata-rata skor, peserta online, grafik aktivitas.
- Bank Soal: CRUD, kategori & sub-kategori (TWK/TIU/TKP), tingkat kesulitan, teks soal (+gambar), 5 opsi (A-E) dengan bobot nilai per opsi, kunci jawaban (untuk TWK/TIU), pembahasan, status draft/terbit, import & export Excel/CSV (sediakan template), pencarian, filter, pagination.
- Paket Ujian: susun dari bank soal (manual atau acak berdasarkan komposisi), durasi, jadwal buka-tutup, passing grade per subtes (bisa diatur), opsi acak soal/opsi, status.
- Peserta: daftar + filter, modal detail peserta, blokir/aktifkan, reset password.
- Hasil & Laporan: rekap per paket, analisis butir soal (persentase benar), ekspor CSV.
- Pengumuman & Pengaturan (passing grade default, peran admin).

## SPESIFIKASI RUANG UJIAN CBT
- Layout fokus tanpa sidebar: soal di kartu besar (kiri), panel nomor soal (kanan), timer monospace di header.
- Status nomor: belum dijawab (Cool Mist), dijawab (Cobalt), ragu-ragu (kuning), aktif (outline Obsidian).
- Timer dihitung SERVER-SIDE (waktu mulai + durasi); klien hanya menampilkan sisa waktu dari server dan sinkron berkala.
- Autosave jawaban setiap pilihan; lanjut otomatis setelah refresh/koneksi putus; satu sesi aktif per peserta.
- Tombol: Sebelumnya, Berikutnya, Ragu-ragu, Selesai (dialog konfirmasi menampilkan jumlah belum dijawab). Auto-submit saat waktu habis.
- Acak urutan soal dan opsi (jika diaktifkan paket). Catat event pindah tab/blur ke tabel log.
- Penilaian SKD (nilai default, WAJIB bisa dikonfigurasi admin karena aturan 2027 bisa berubah):
  TWK 30 soal (benar=5, salah=0), TIU 35 soal (benar=5, salah=0), TKP 45 soal (skor opsi 1-5), total 110 soal, 100 menit.
  Status lulus jika SETIAP subtes >= passing grade subtesnya DAN total >= passing grade total.

## DATABASE (PostgreSQL) - entitas minimal
users(id uuid, name, email unique, phone, password_hash, role[admin|peserta], status, created_at...),
refresh_tokens, categories(id, parent_id, code[TWK|TIU|TKP], name),
questions(id, category_id, body, image_url, difficulty, explanation, status, created_by),
question_options(id, question_id, label[A-E], body, weight),
exam_packages(id, title, description, duration_minutes, start_at, end_at, shuffle_questions, shuffle_options, status, pass_twk, pass_tiu, pass_tkp, pass_total),
package_questions(package_id, question_id, position),
attempts(id, user_id, package_id, started_at, deadline_at, submitted_at, status),
attempt_answers(attempt_id, question_id, option_id, is_flagged, answered_at),
results(attempt_id, score_twk, score_tiu, score_tkp, score_total, passed, rank),
attempt_events(attempt_id, type, created_at), announcements, activity_logs.
Gunakan index yang tepat, foreign key, dan migrasi up/down.

## STANDAR KUALITAS
- Format respons API konsisten { success, data, error, meta }. Validasi input (go-playground/validator), error handling rapi, CORS ketat, rate limit login, RBAC middleware, query berparameter (anti SQL injection), sanitasi input, jangan pernah kirim kunci jawaban ke klien selama ujian berlangsung.
- Env lewat .env, tanpa secret di kode. Seed data: 1 admin, 3 peserta, ~60 soal contoh (TWK/TIU/TKP), 1 paket tryout.
- Kode bersih, komentar singkat di bagian penting, tes unit untuk logika penilaian dan timer, README berisi cara menjalankan.
- Teks antarmuka berbahasa Indonesia.
- Kerjakan bertahap sesuai tahap yang saya berikan. Setelah tiap tahap: jalankan lint/build/test, perbaiki error, lalu ringkas apa yang selesai dan cara mengujinya.
```

---

## PROMPT TAHAP 1 — Fondasi, Design System, Autentikasi

```
Kerjakan TAHAP 1 sesuai konteks global (CLAUDE.md).

1. Inisialisasi monorepo (/apps/web, /apps/api), docker-compose (postgres + api + web), .env.example, README awal.
2. Frontend: setup Next.js App Router + Tailwind. Isi tailwind.config.js dengan token warna (mint, cobalt, mist, ghost, obsidian), radius (card 24/32px), shadow halus, font Inter. Buat halaman /design-system yang menampilkan semua komponen UI (Button, Input 5 state, Card, Chip, Badge, ProgressBar bersegmen, Gauge, Table, Modal, Topbar, Tabs pill) agar bisa direview visual.
3. Layout: (public), (peserta) dengan topbar pill, (admin) dengan sidebar Obsidian ringkas + topbar. Middleware Next.js untuk proteksi rute berdasarkan role.
4. Backend: struktur Gin, config, koneksi PostgreSQL, migrasi tabel users & refresh_tokens, endpoint:
   POST /auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/forgot-password, /auth/reset-password, GET /auth/me.
   Middleware: auth JWT, RBAC, rate limit login, CORS, request logger, recover.
5. Halaman Login & Daftar sesuai design system (state input lengkap, pesan error Bahasa Indonesia, loading state), terhubung ke API, token di cookie httpOnly.
6. Seed 1 admin + 3 peserta.
Kriteria selesai: bisa daftar, login, logout, akses rute sesuai role; build & lint lolos; /design-system tampil rapi di mobile dan desktop.
```

---

## PROMPT TAHAP 2 — Bank Soal & Paket Ujian (Admin)

```
Kerjakan TAHAP 2 (Panel Admin: Bank Soal & Paket Ujian). Pertahankan gaya "Order. Balance. Clarity.".

Backend: migrasi categories, questions, question_options, exam_packages, package_questions; seed kategori TWK/TIU/TKP + sub-kategori (mis. TWK: Nasionalisme, Integritas, Bela Negara, Pilar Negara, Bahasa Indonesia; TIU: Verbal, Numerik, Figural/Logika; TKP: Pelayanan Publik, Jejaring Kerja, Sosial Budaya, TIK, Profesionalisme, Anti Radikalisme).
Endpoint admin (RBAC): CRUD categories, CRUD questions (+opsi dan bobot), upload gambar soal, import CSV/Excel (validasi per baris + laporan error), export, CRUD exam_packages, atur soal paket (manual dan acak berdasarkan komposisi TWK/TIU/TKP), publish/unpublish. Pagination, pencarian, filter.

Frontend admin:
- Dashboard admin (kartu angka besar + grafik aktivitas) dengan data nyata dari API.
- Halaman Bank Soal: tabel + filter kategori/kesulitan/status, form tambah/edit soal (editor sederhana, 5 opsi dengan input bobot, pembahasan, upload gambar), pratinjau soal, modal import dengan unduh template.
- Halaman Paket Ujian: daftar kartu dengan chip (durasi, jumlah soal, jadwal, status), form buat/edit, pemilih soal dengan pencarian, pengaturan passing grade.
Sertakan validasi, state kosong yang ramah, skeleton loading, dan konfirmasi sebelum hapus.
Kriteria selesai: admin bisa mengisi bank soal (termasuk import), membuat dan menerbitkan paket; tes unit untuk validasi import.
```

---

## PROMPT TAHAP 3 — Ruang Ujian CBT & Penilaian

```
Kerjakan TAHAP 3 (inti aplikasi): Ruang Ujian CBT dan penilaian, sesuai bagian "SPESIFIKASI RUANG UJIAN CBT" di konteks global.

Backend:
- Migrasi attempts, attempt_answers, results, attempt_events.
- Endpoint peserta: GET /packages (yang tersedia), POST /attempts/start (cek jadwal, cegah sesi ganda, hitung deadline_at server-side, acak soal/opsi bila diaktifkan), GET /attempts/:id (soal TANPA kunci jawaban + sisa waktu), PUT /attempts/:id/answer (simpan/ubah jawaban, flag ragu-ragu), POST /attempts/:id/event (log pindah tab), POST /attempts/:id/submit.
- Auto-submit saat deadline terlewati (cek saat request + job periodik).
- Service penilaian: TWK/TIU benar=5, TKP skor bobot opsi 1-5, total, status lulus berdasarkan passing grade per subtes dan total, peringkat. Buat TES UNIT lengkap (kasus batas: kosong semua, semua benar, waktu habis, double submit).
Frontend:
- Halaman Daftar Tryout (kartu + chip), halaman instruksi sebelum mulai, dan Ruang Ujian: kartu soal besar (kiri), panel nomor soal bergaya grid pill (kanan) dengan 4 status warna, timer monospace, tombol Sebelumnya/Berikutnya/Ragu-ragu/Selesai + dialog konfirmasi, autosave dengan indikator "Tersimpan", pemulihan sesi setelah refresh, peringatan saat sisa waktu 5 menit (warna merah lembut), layout responsif untuk tablet.
- Halaman Hasil: skor per subtes (kartu angka besar), badge Lulus/Tidak Lulus, gauge, pembahasan per soal dengan filter benar/salah/kosong.
Kriteria selesai: satu alur penuh peserta dari memilih paket sampai melihat pembahasan berjalan; timer tidak bisa dimanipulasi dari klien; kunci jawaban tidak pernah muncul di response saat ujian berlangsung.
```

---

## PROMPT TAHAP 4 — Dashboard, Riwayat, Laporan & Manajemen Peserta

```
Kerjakan TAHAP 4.

Peserta:
- Dashboard (/dashboard) mengikuti layout referensi: kartu Kalender mingguan (hari terpilih Cobalt, kartu jadwal ujian terdekat dengan chip), kartu Total Waktu belajar (line chart 7 hari + persentase vs kemarin), kartu Kehadiran/Progres berupa gauge setengah lingkaran (rata-rata skor atau persentase paket selesai), kartu Target Harian (daftar bertimeline dengan chip prioritas/kategori).
- Halaman Latihan Soal (mode belajar, pembahasan langsung), Riwayat ujian (tabel + badge status + ekspor CSV), Profil.
- Endpoint statistik yang dibutuhkan (waktu belajar harian, rata-rata skor, progres paket).
Admin:
- Manajemen Peserta: tabel + filter tab pill, modal "Detail Peserta" (profil, ringkasan 4 kartu: jumlah ujian, rata-rata skor, lulus, tidak lulus; tabel riwayat dengan filter dan ekspor CSV), blokir/aktifkan, reset password.
- Hasil & Laporan: rekap per paket, distribusi skor (bar chart), analisis butir soal (persentase benar, soal terlalu mudah/sulit), ekspor CSV.
- Pengumuman (CRUD, tampil di dashboard peserta) dan Pengaturan passing grade default.
Kriteria selesai: semua halaman memakai data nyata, responsif, memiliki state kosong/loading/error yang konsisten.
```

---

## PROMPT TAHAP 5 — Keamanan, Polesan, Uji & Deployment

```
Kerjakan TAHAP 5 (hardening dan finishing).

1. Audit keamanan: otorisasi tiap endpoint (peserta hanya akses datanya sendiri), validasi & sanitasi input, rate limit endpoint sensitif, header keamanan, cookie flags (httpOnly, secure, sameSite), proteksi upload (tipe & ukuran), pastikan tidak ada kebocoran kunci jawaban, log aktivitas admin.
2. Performa: index database, pagination di semua daftar, caching ringan untuk data referensi, optimasi gambar, code-splitting.
3. Aksesibilitas & UX: navigasi keyboard di ruang ujian, kontras WCAG AA, fokus ring, teks alternatif, pesan error jelas, halaman 404/500 bergaya sama.
4. Pengujian: tes unit (penilaian, timer, auth), tes integrasi API untuk alur ujian, tes uji beban sederhana (k6 atau vegeta) untuk 500 peserta serentak submit jawaban, dan laporkan hasilnya.
5. Deployment: Dockerfile multi-stage untuk web & api, docker-compose produksi dengan reverse proxy (Caddy/Nginx) + HTTPS, backup otomatis PostgreSQL, health check, README lengkap (instalasi, env, seed, backup, troubleshooting).
6. Rapikan: hapus kode mati, pastikan lint/build/test hijau, buat CHANGELOG dan daftar backlog fase 2 (mode gelap, pembayaran/langganan, leaderboard, notifikasi email, aplikasi mobile).
Kriteria selesai: seluruh checklist di atas tercentang dan dilaporkan satu per satu.
```

---

## Catatan
- Passing grade dan komposisi soal dibuat **dapat dikonfigurasi** karena ketentuan resmi SKD 2027 belum tentu sama dengan tahun sebelumnya. Cek ketentuan resmi dari BKN/KemenPAN-RB saat sudah terbit.
- Pembayaran/langganan dan mode gelap sengaja ditunda ke fase 2 (sudah masuk backlog Tahap 5).
