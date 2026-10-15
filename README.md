# BISA-PNS

Platform latihan dan **tryout CBT (Computer Based Test)** untuk persiapan **Seleksi CPNS 2027 — SKD (TWK, TIU, TKP)**.
Desain "Order. Balance. Clarity.": rapi, seimbang, satu fokus per kartu.

## Daftar isi
- [Fitur](#fitur)
- [Stack](#stack)
- [Struktur folder](#struktur-folder)
- [Cara cepat dengan Docker (Windows/Mac/Linux)](#cara-cepat-dengan-docker-windowsmaclinux)
- [Cara manual tanpa Docker](#cara-manual-tanpa-docker)
- [Akun demo](#akun-demo)
- [Variabel lingkungan](#variabel-lingkungan)
- [Aturan penilaian SKD](#aturan-penilaian-skd)
- [Format CSV import bank soal](#format-csv-import-bank-soal)
- [Deployment produksi](#deployment-produksi)
- [Backup & restore](#backup--restore)
- [Uji beban](#uji-beban)
- [Keamanan](#keamanan)
- [Troubleshooting](#troubleshooting)
- [Roadmap fase 2](#roadmap-fase-2)

---

## Fitur

**Peserta**
- Daftar, login, lupa/reset password, ubah profil & password.
- Dashboard: kalender mingguan + jadwal ujian terdekat, grafik waktu belajar 7 hari vs kemarin, gauge rata-rata skor, target harian, pengumuman.
- Latihan soal per subtes/sub-materi dengan pembahasan langsung (mode belajar).
- Daftar tryout, riwayat ujian, hasil & pembahasan lengkap (skor per subtes, status lulus, peringkat).

**Ruang ujian CBT**
- Timer dihitung **di server** (waktu mulai + durasi); klien hanya menampilkan sisa waktu.
- Autosave setiap jawaban, tandai ragu-ragu, panel nomor soal 4 status warna, lanjut otomatis setelah refresh/koneksi putus.
- Auto-submit saat waktu habis, acak soal/opsi per paket, pencatatan pindah tab/blur/keluar layar penuh.
- Kunci jawaban & bobot **tidak pernah** dikirim ke klien selama ujian.

**Admin**
- Dashboard statistik (peserta, online, soal, paket, rata-rata skor, grafik aktivitas 14 hari).
- Bank soal: CRUD, kategori & sub-kategori, tingkat kesulitan, gambar, 5 opsi berbobot, pembahasan, draft/terbit, **import/export CSV** + template.
- Paket ujian: susun manual atau acak berdasarkan komposisi, jadwal buka–tutup, passing grade per subtes, acak soal/opsi, publish/arsip.
- Manajemen peserta (detail, blokir/aktifkan, reset password, ekspor), laporan per paket & analisis butir soal, pengumuman, pengaturan passing grade default, log aktivitas.

## Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | Next.js 15 (App Router, **JavaScript/JSX**), Tailwind CSS 3, lucide-react, chart SVG custom |
| Backend | Go 1.24, Gin, pgx/v5, JWT (HS256), bcrypt |
| Database | PostgreSQL 16 (migrasi tertanam, jalan otomatis saat API start) |
| Infrastruktur | Docker, Docker Compose, Caddy 2 (HTTPS otomatis), k6 (uji beban) |

## Struktur folder

```
bisa-pns/
├─ apps/
│  ├─ api/                 # Go + Gin (modul bisapns/api)
│  │  ├─ cmd/api/          # entry server HTTP (PORT, default 8080)
│  │  ├─ cmd/seed/         # seeder data demo
│  │  ├─ internal/         # handler, service, migrasi, middleware
│  │  ├─ Dockerfile
│  │  └─ .env.example
│  └─ web/                 # Next.js 15 (output: standalone)
│     ├─ app/              # rute publik, peserta, admin, ujian
│     ├─ components/ui/    # design system
│     ├─ lib/              # api client, format, auth
│     └─ Dockerfile
├─ deploy/                 # Caddyfile, skrip backup harian
├─ docs/                   # SPEC.md (kontrak API & desain), PROMPT_BISA-PNS.md
├─ scripts/                # dev-up.ps1, dev-up.sh, backup.sh, restore.sh
├─ tests/load/             # skenario k6 500 peserta
├─ docker-compose.yml      # lokal / pengembangan
├─ docker-compose.prod.yml # produksi (Caddy + backup)
├─ .env.example
├─ CLAUDE.md · CHANGELOG.md
```

---

## Cara cepat dengan Docker (Windows/Mac/Linux)

Prasyarat: **Docker Desktop** (Windows/Mac) atau Docker Engine + plugin Compose v2 (Linux). Pada Windows aktifkan backend **WSL 2** di Docker Desktop.

### Windows (PowerShell)
```powershell
cd "C:\Users\ASUS\Music\GARUDA NEXA BAHTERA\BISA_PNS"
powershell -ExecutionPolicy Bypass -File .\scripts\dev-up.ps1
```
Skrip akan: memeriksa Docker, menyalin `.env.example` → `.env` (jika belum ada), menjalankan `docker compose up -d --build`, menunggu web siap, lalu membuka browser.

### Mac / Linux
```bash
./scripts/dev-up.sh
```

### Manual (semua OS)
```bash
cp .env.example .env            # Windows: copy .env.example .env
docker compose up -d --build
docker compose logs -f api      # pantau migrasi & seed
```

| Layanan | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:8080 (health: `/health`) |
| PostgreSQL | `localhost:5432` (user/pass/db: `bisapns`) |

Build pertama memerlukan 3–10 menit (unduh dependensi Go & npm). Migrasi database berjalan otomatis; `SEED=true` mengisi data demo (1 admin, 3 peserta, ±60 soal, 1 paket tryout).

Perintah berguna:
```bash
docker compose ps                     # status & health
docker compose logs -f api web        # log
docker compose down                   # hentikan (data tetap)
docker compose down -v                # hentikan + HAPUS data database & upload
docker compose exec db psql -U bisapns -d bisapns
```

---

## Cara manual tanpa Docker

1. **Instal**: [Go 1.24](https://go.dev/dl/), [Node.js 22 LTS](https://nodejs.org/), [PostgreSQL 16](https://www.postgresql.org/download/).
2. **Buat database** (psql sebagai superuser `postgres`):
   ```sql
   CREATE USER bisapns WITH PASSWORD 'bisapns';
   CREATE DATABASE bisapns OWNER bisapns;
   ```
3. **Jalankan API** (terminal 1):
   ```bash
   cd apps/api
   cp .env.example .env      # sesuaikan bila perlu; nilai default sudah cocok dengan langkah 2
   go mod tidy               # wajib: go.sum tidak disertakan di repo
   go run ./cmd/seed         # migrasi + data demo
   go run ./cmd/api          # http://localhost:8080
   ```
   Variabel env dibaca dari environment. Linux/Mac: `set -a; . ./.env; set +a`. PowerShell: lihat baris komentar di `apps/api/.env.example`, atau set satu per satu, mis. `$env:DATABASE_URL="postgres://bisapns:bisapns@localhost:5432/bisapns?sslmode=disable"`. Tanpa env apa pun, API memakai default pengembangan yang sama.
4. **Jalankan web** (terminal 2):
   ```bash
   cd apps/web
   npm install
   npm run dev               # http://localhost:3000
   ```
   Web me-*rewrite* `/api/*` dan `/uploads/*` ke `API_URL` (default `http://localhost:8080`) sehingga cookie tetap same-origin.

Uji: `cd apps/api && go test ./...` · `cd apps/web && npm run lint && npm run build`.

---

## Akun demo

| Peran | Email | Password |
|---|---|---|
| Admin | `admin@bisapns.id` | `Admin123!` |
| Peserta | `peserta1@bisapns.id` (s.d. `peserta3`) | `Peserta123!` |

> Ganti/nonaktifkan akun demo sebelum produksi.

## Variabel lingkungan

**API (`apps/api`)**

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `8080` | Port HTTP API |
| `DATABASE_URL` | `postgres://bisapns:bisapns@localhost:5432/bisapns?sslmode=disable` | Koneksi PostgreSQL |
| `JWT_SECRET` | (dev) | **Wajib** diganti di produksi, ≥ 32 karakter acak (`openssl rand -base64 48`) |
| `APP_ENV` | `development` | `development` \| `production` (produksi: tanpa `dev_token`, log ringkas) |
| `CORS_ORIGINS` | `http://localhost:3000` | Origin yang diizinkan, pisahkan koma |
| `UPLOAD_DIR` | `./uploads` | Folder gambar soal (di Docker: volume `/app/uploads`) |
| `COOKIE_SECURE` | `false` | `true` bila diakses via HTTPS |
| `SEED` | `false` | `true` → isi data demo saat API start |

**Web (`apps/web`)**: `API_URL` — tujuan rewrites (`http://localhost:8080` lokal, `http://api:8080` di Docker). Karena rewrites dievaluasi saat `next build`, di Docker nilainya dikirim sebagai build-arg.

**Compose (`.env` root)**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, `APP_ENV`, `CORS_ORIGINS`, `SEED`, `WEB_PORT`, `API_PORT`, `DB_PORT`, serta untuk produksi `DOMAIN`, `ACME_EMAIL`, `BACKUP_TIME`, `BACKUP_RETENTION_DAYS`. Lihat `.env.example`.

---

## Aturan penilaian SKD

| Subtes | Jumlah soal | Penilaian | Skor maks |
|---|---|---|---|
| TWK (Tes Wawasan Kebangsaan) | 30 | benar = 5, salah/kosong = 0 | 150 |
| TIU (Tes Intelegensia Umum) | 35 | benar = 5, salah/kosong = 0 | 175 |
| TKP (Tes Karakteristik Pribadi) | 45 | setiap opsi berbobot 1–5 | 225 |
| **Total** | **110** | durasi **100 menit** | **550** |

Peserta **lulus** bila TWK ≥ passing grade TWK, TIU ≥ passing grade TIU, TKP ≥ passing grade TKP, **dan** total ≥ passing grade total.
Nilai default (TWK 65, TIU 80, TKP 166) mengikuti ketentuan tahun-tahun sebelumnya dan **dapat diatur admin** di *Pengaturan* (default) maupun per paket.

> Ketentuan SKD 2027 belum tentu sama. **Cek ketentuan resmi BKN / KemenPAN-RB** saat sudah terbit dan sesuaikan passing grade, komposisi, serta durasi.

---

## Format CSV import bank soal

- Encoding **UTF-8** (boleh dengan BOM), delimiter **titik koma (`;`)**, baris pertama = header.
- Unduh template dari *Admin → Bank Soal → Import → Unduh template*.

Kolom (urut):
```
subtes;kategori;kesulitan;status;soal;opsi_a;bobot_a;opsi_b;bobot_b;opsi_c;bobot_c;opsi_d;bobot_d;opsi_e;bobot_e;pembahasan;gambar_url
```

| Kolom | Nilai |
|---|---|
| `subtes` | `TWK` \| `TIU` \| `TKP` |
| `kategori` | nama sub-kategori yang sudah ada (mis. `Nasionalisme`, `Numerik`, `Pelayanan Publik`) |
| `kesulitan` | `mudah` \| `sedang` \| `sulit` |
| `status` | `draft` \| `terbit` |
| `opsi_a`…`opsi_e` | teks opsi |
| `bobot_a`…`bobot_e` | TWK/TIU: **tepat satu** opsi bernilai `5`, lainnya `0`. TKP: **setiap** opsi `1`–`5` |
| `pembahasan` | teks pembahasan (opsional) |
| `gambar_url` | URL gambar (opsional), mis. `/uploads/abc.png` |

Contoh:
```
subtes;kategori;kesulitan;status;soal;opsi_a;bobot_a;opsi_b;bobot_b;opsi_c;bobot_c;opsi_d;bobot_d;opsi_e;bobot_e;pembahasan;gambar_url
TWK;Pancasila;sedang;terbit;Sila keempat Pancasila dilambangkan dengan...;Bintang;0;Rantai;0;Pohon beringin;0;Kepala banteng;5;Padi dan kapas;0;Sila ke-4 dilambangkan kepala banteng.;
TKP;Pelayanan Publik;mudah;draft;Ada warga yang kebingungan mengisi formulir...;Membiarkan;1;Menyuruh bertanya ke petugas lain;2;Memberi contoh tertulis;3;Menjelaskan singkat;4;Membantu hingga selesai;5;;
```
Teks yang mengandung `;` atau baris baru harus diapit tanda kutip ganda (`"..."`). Import memvalidasi setiap baris; bila ada kesalahan, tidak ada data yang disimpan dan laporan error per baris ditampilkan.

> Membuka/menyimpan CSV di Excel Indonesia: Excel memakai `;` sebagai pemisah secara default — pilih *Save As → CSV UTF-8 (Comma delimited)* lalu pastikan pemisahnya titik koma.

---

## Deployment produksi

Arsitektur: **Caddy** (80/443, HTTPS otomatis Let's Encrypt) → `web:3000` (Next.js) dan `api:8080` (`/api/*`, `/uploads/*`, `/health`). Web, API, dan database **tidak diekspos** ke internet. Service `backup` membuat `pg_dump` harian ke `./backups` dengan retensi 14 hari.

1. Server Linux (≥ 2 vCPU, 4 GB RAM) dengan Docker + Compose v2, port 80 & 443 terbuka.
2. Arahkan **A record** domain (mis. `tryout.domainanda.id`) ke IP server.
3. Siapkan env:
   ```bash
   cp .env.example .env
   # isi minimal:
   # DOMAIN=tryout.domainanda.id
   # ACME_EMAIL=admin@domainanda.id
   # POSTGRES_PASSWORD=<password kuat>
   # JWT_SECRET=<openssl rand -base64 48>
   # SEED=true   (hanya pada start pertama untuk membuat admin & data contoh, lalu kembalikan ke false)
   ```
4. Jalankan:
   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env up -d --build
   docker compose -f docker-compose.prod.yml logs -f caddy api
   ```
5. Login admin, **ganti password admin**, hapus/blokir akun demo, sesuaikan passing grade.

Otomatis di produksi: `APP_ENV=production`, `COOKIE_SECURE=true`, `CORS_ORIGINS=https://$DOMAIN`, header keamanan (HSTS, `X-Frame-Options`, `nosniff`), kompresi, rotasi log container.

Update versi:
```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Backup & restore

- **Otomatis (produksi)**: service `backup` → `./backups/bisapns-YYYYmmdd-HHMMSS.dump` setiap hari pukul `BACKUP_TIME` (default 02:00 WIB), file > `BACKUP_RETENTION_DAYS` (14) hari dihapus. Salin folder `backups/` ke penyimpanan lain (rsync/rclone) secara berkala.
- **Manual**:
  ```bash
  scripts/backup.sh                                  # lokal (docker-compose.yml)
  scripts/backup.sh docker-compose.prod.yml          # produksi
  scripts/restore.sh backups/bisapns-20261012-020000.dump [docker-compose.prod.yml]
  ```
  Di Windows jalankan skrip `.sh` lewat Git Bash/WSL, atau langsung:
  ```powershell
  docker compose exec -T db pg_dump -U bisapns -d bisapns -Fc > backups\manual.dump
  ```
  (Catatan: redirect `>` di PowerShell 5 dapat merusak file biner — gunakan Git Bash/WSL atau PowerShell 7.4+.)
- Gambar soal berada di volume `uploads`; backup juga dengan `docker run --rm -v bisa-pns-prod_uploads:/d -v "$PWD/backups":/b alpine tar czf /b/uploads.tgz -C /d .`

## Uji beban

Skenario k6 500 peserta serentak (login → mulai tryout → 20 jawaban → submit), target p95 < 800 ms dan error < 1 %. Panduan lengkap & SQL pembuatan 500 akun uji: [`tests/load/README.md`](tests/load/README.md).

---

## Keamanan

- Password di-hash **bcrypt**; JWT access 15 menit + refresh 7 hari di cookie **httpOnly**, `SameSite`, `Secure` (produksi).
- RBAC admin/peserta di setiap endpoint; peserta hanya dapat mengakses data miliknya.
- Rate limit login & endpoint sensitif; query berparameter (anti SQL injection); validasi & sanitasi input.
- Timer ujian & penilaian sepenuhnya di server; kunci jawaban tidak pernah dikirim selama ujian.
- Upload hanya gambar ≤ 2 MB.
- Checklist produksi: ganti `JWT_SECRET` & `POSTGRES_PASSWORD`, `SEED=false`, ganti password admin, hapus akun demo, jangan ekspos port 5432/8080/3000, simpan backup di luar server, perbarui image secara berkala.
- Jangan commit `.env` (sudah di `.gitignore`).

## Troubleshooting

| Masalah | Solusi |
|---|---|
| **Port bentrok** (`port is already allocated`, `bind: address already in use`) | Ubah `WEB_PORT`/`API_PORT`/`DB_PORT` di `.env` (mis. `DB_PORT=5433` bila PostgreSQL lokal sudah jalan), lalu `docker compose up -d`. Cek pemakai port: Windows `netstat -ano \| findstr :5432`, Mac/Linux `lsof -i :5432`. Bila mengubah `WEB_PORT`, tambahkan juga origin baru ke `CORS_ORIGINS`. |
| **`missing go.sum entry` / `go: updates to go.mod needed`** | Jalankan `cd apps/api && go mod tidy`. Di Docker sudah otomatis. Di balik proxy kantor set `GOPROXY=https://proxy.golang.org,direct` atau `GOPROXY=https://goproxy.io,direct`. |
| **Reset database** (data rusak/ingin mulai bersih) | Docker: `docker compose down -v && docker compose up -d --build` (menghapus semua data & upload). Manual: `DROP DATABASE bisapns; CREATE DATABASE bisapns OWNER bisapns;` lalu `go run ./cmd/seed`. |
| **Cookie tidak tersimpan / login berulang kembali ke /login** | Akses web lewat `http://localhost:3000` (bukan `127.0.0.1` bila `CORS_ORIGINS` berisi `localhost`), jangan memanggil API lintas origin langsung. Di HTTP lokal `COOKIE_SECURE` harus `false`; di HTTPS harus `true`. Pastikan `API_URL` web benar dan jam sistem server/klien akurat (JWT 15 menit). Hapus cookie lama di DevTools → Application → Cookies. |
| `web` terus `waiting`/unhealthy | `docker compose logs api` — API menunggu database atau gagal migrasi. Pastikan `db` healthy. |
| Build web gagal `Cannot find module ... standalone` | Pastikan `next.config.mjs` memuat `output: 'standalone'`. |
| Skrip `.sh` gagal `\r: command not found` di container | File ber-akhiran CRLF. Jalankan `git config core.autocrlf input` lalu clone ulang, atau konversi ke LF (sudah diatur via `.gitattributes`). |
| PowerShell menolak menjalankan skrip | `powershell -ExecutionPolicy Bypass -File .\scripts\dev-up.ps1` |
| Docker Desktop lambat di Windows | Simpan repo di filesystem WSL (`\\wsl$\Ubuntu\home\...`) atau tambah RAM di *Settings → Resources*. |
| HTTPS gagal di produksi | Domain harus sudah mengarah ke server, port 80/443 terbuka, `ACME_EMAIL` valid. Lihat `docker compose -f docker-compose.prod.yml logs caddy`. |

## Roadmap fase 2

- [ ] **Mode gelap** (token warna sudah disiapkan sebagai CSS variables)
- [ ] **Pembayaran/langganan** paket premium (payment gateway lokal: QRIS, VA, e-wallet)
- [ ] **Leaderboard** nasional & per paket
- [ ] **Notifikasi email** (verifikasi akun, reset password, pengingat jadwal tryout)
- [ ] **Aplikasi mobile** (Android/iOS) memakai API yang sama

---

Lisensi: privat / internal. Lihat [`CHANGELOG.md`](CHANGELOG.md) untuk riwayat rilis.
