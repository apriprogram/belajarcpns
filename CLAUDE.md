# CLAUDE.md — BISA-PNS

> Konteks global proyek (disalin dari `docs/PROMPT_BISA-PNS.md` → PROMPT 0). Kontrak API, bentuk data, design token, dan peta halaman yang **mengikat** ada di [`docs/SPEC.md`](docs/SPEC.md) — baca itu sebelum mengubah endpoint atau komponen.

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

---

## Status implementasi (v1.0.0)

| Area | Status | Lokasi |
|---|---|---|
| Spesifikasi bersama (kontrak API, design system) | Selesai | `docs/SPEC.md` |
| Backend Go + Gin + pgx, migrasi embed otomatis, seeder | Tahap 1–5 | `apps/api` (`cmd/api`, `cmd/seed`, `internal/*`) |
| Frontend Next.js 15 (JS) + Tailwind, design system, panel peserta/admin, ruang CBT | Tahap 1–5 | `apps/web` |
| Docker (multi-stage api & web), compose lokal & produksi (Caddy + backup) | Selesai | `apps/*/Dockerfile`, `docker-compose*.yml`, `deploy/` |
| Skrip operasional (backup/restore/dev-up) | Selesai | `scripts/` |
| Uji beban k6 500 VU | Skenario siap, hasil dilaporkan per rilis | `tests/load/` |
| Fase 2 (mode gelap, pembayaran, leaderboard, email, mobile) | Backlog | `README.md` → Roadmap |

### Catatan kerja
- Monorepo: `apps/api` modul Go `bisapns/api`; `go.sum` tidak disertakan → selalu `go mod tidy` sebelum build (Dockerfile sudah melakukannya).
- Env API: `PORT, DATABASE_URL, JWT_SECRET, APP_ENV, CORS_ORIGINS, UPLOAD_DIR, COOKIE_SECURE, SEED`. Endpoint health: `GET /health`.
- Web memakai `output: 'standalone'`; `API_URL` dipakai rewrites `/api/*` & `/uploads/*` (dievaluasi saat build).
- Akun demo: `admin@bisapns.id / Admin123!`, `peserta1@bisapns.id / Peserta123!`.
- Setelah tiap perubahan: `go vet ./... && go test ./...` (api), `npm run lint && npm run build` (web).
