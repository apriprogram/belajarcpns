# BISA-PNS API (apps/api)

Kontrak endpoint yang mengikat ada di [`SPEC.md`](SPEC.md). Dokumen ini hanya berisi cara menjalankan dan catatan implementasi.

## Catatan perbedaan / tambahan terhadap SPEC

Tidak ada endpoint atau field SPEC yang dihilangkan atau diganti namanya. Ada beberapa tambahan dan perilaku yang perlu diketahui frontend:

| Area | Perilaku |
|---|---|
| `POST /api/attempts` | Mengembalikan **201** untuk attempt baru dan **200** untuk `resumed:true`. Penolakan: 404 (paket tidak ada/belum terbit), **409 `CONFLICT`** dengan pesan "Ujian belum dibuka…", "Jadwal ujian sudah ditutup." atau "Paket ini belum memiliki soal." |
| `GET /api/attempts/:id` saat `status:"selesai"` | `questions: []`, `answers: {}`, `remaining_seconds: 0`, plus field tambahan `submitted_at`. Bukan pemilik → 404. |
| `PUT /api/attempts/:id/answers` | Attempt sudah selesai → 409 `ATTEMPT_FINISHED`; waktu habis → 409 `TIME_UP` (attempt difinalisasi otomatis). `option_id:null` menghapus jawaban tapi `is_flagged` tetap disimpan. |
| `POST /api/attempts/:id/events` | Respons `{recorded:true, tab_switches}`. `tab_hidden`/`blur` menambah `tab_switches`; `fullscreen_exit` hanya dicatat. |
| `POST /api/attempts/:id/submit` | Idempoten. Submit berulang mengembalikan hasil yang sama (200). |
| `GET /api/results/:id` | `max` dihitung dari soal attempt (paket penuh: 150/175/225; paket mini bisa `TKP:0`). `participants` = jumlah hasil (attempt selesai) di paket itu; `rank` = 1 + jumlah hasil dengan skor total lebih tinggi. |
| `POST /api/me/heartbeat` | Respons `{day, seconds, today_minutes}`. Nilai > 120 dipotong menjadi 120; ≤ 0 → 422. |
| Target harian | `subtest` menerima `TWK`, `TIU`, `TKP`, atau `SKD` (umum). Default: subtes `TWK`, jam `09:00`, prioritas `sedang`, hari = hari ini (WIB). |
| Latihan | `GET /api/practice/questions` juga menerima `difficulty`. `category_id` boleh berupa ID kategori induk (mencakup semua sub-kategorinya). |
| Paket admin (input) | `start_at`/`end_at` menerima RFC3339 atau `YYYY-MM-DDTHH:mm` (nilai `datetime-local`, dianggap WIB); `""`/`null` = tanpa jadwal. Field `pass_*` dan `duration_minutes` yang tidak dikirim memakai Pengaturan (untuk POST) atau nilai lama (untuk PUT). `PUT` mengganti `title`, `description`, dan flag acak. |
| `POST /admin/packages/:id/auto-fill` | Body kosong memakai `composition` dari Pengaturan. Stok soal terbit kurang → 422 dengan `fields.twk/tiu/tkp`. |
| `PATCH /admin/packages/:id/status` | Paket tanpa soal tidak bisa terbit → 422 `fields.status`. |
| `DELETE /admin/packages/:id` | Paket yang sudah pernah dikerjakan → 409 dengan saran mengarsipkan. |
| `GET /admin/users` | Default hanya `role=peserta`; `?role=admin` atau `?role=all` untuk melihat yang lain. |
| `PATCH /admin/users/:id/status` | Admin memblokir dirinya sendiri → 409. Blokir mencabut semua refresh token. **Setiap request dari akun yang diblokir langsung ditolak 403 `FORBIDDEN`** ("Akun Anda diblokir…") walau access token belum kedaluwarsa. |
| Laporan paket | `items[].flag` diisi bila `answered ≥ 1` (ambang sengaja rendah agar data seed terlihat; ubah `minItemAnswers` di `admin_handlers.go`, mis. 5, untuk produksi). `pct_correct ≥ 90` → `terlalu_mudah`, `≤ 20` → `terlalu_sulit`. |
| `GET /admin/categories` / `GET /categories` | `question_count` kategori induk = jumlah semua soal di subtes tersebut. |

Waktu "hari ini" (study log, target, dashboard) memakai zona **Asia/Jakarta (WIB)**. Semua timestamp dikirim dalam RFC3339.

## Menjalankan (dev)

Sandbox ini memblokir proxy.golang.org, jadi selalu jalankan:

```bash
export GOPROXY=direct GOSUMDB=off GOFLAGS=-mod=mod
cd apps/api
go run ./cmd/seed          # migrasi + data contoh (idempoten, aman diulang)
go run ./cmd/api           # API di :8080 (migrasi otomatis saat start)
go run ./cmd/api -seed     # atau SEED=true go run ./cmd/api → seed lalu serve
```

Jangan hapus blok `// DEV-ONLY-REPLACE-START … END` di `go.mod` (mirror GitHub untuk golang.org/x).

Cek kualitas: `go vet ./... && go test ./... && go build ./...`. Tes `TestFinalizeAttemptIdempotent` memakai `DATABASE_URL` (default lokal di bawah) dan otomatis di-skip bila database tidak tersedia.

### PostgreSQL lokal (sandbox)

Cluster ada di `/tmp/pgdata` (PostgreSQL 16, auth trust, superuser `postgres`), role/db `bisapns`/`bisapns`, port 5432.

```bash
# start ulang (sebagai user postgres)
su postgres -s /bin/bash -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgdata -l /tmp/pg.log -o '-p 5432 -k /tmp -c listen_addresses=localhost' start"
# stop
su postgres -s /bin/bash -c "/usr/lib/postgresql/16/bin/pg_ctl -D /tmp/pgdata stop"
# bila /tmp/pgdata hilang: buat ulang
mkdir -p /tmp/pgdata && chown postgres:postgres /tmp/pgdata
su postgres -s /bin/bash -c "/usr/lib/postgresql/16/bin/initdb -D /tmp/pgdata -U postgres --auth=trust -E UTF8"
# (lalu start seperti di atas)
psql -h localhost -U postgres -c "CREATE ROLE bisapns LOGIN PASSWORD 'bisapns'" -c "CREATE DATABASE bisapns OWNER bisapns"
# reset data: DROP DATABASE bisapns; CREATE DATABASE bisapns OWNER bisapns; lalu go run ./cmd/seed
```

### API di background

```bash
cd apps/api && go build -o /tmp/bisapns-api ./cmd/api
setsid nohup /tmp/bisapns-api > /tmp/api.log 2>&1 < /dev/null &
curl localhost:8080/health      # {"status":"ok"}
# stop: kill $(pgrep -f 'tmp/bisapns-api$')
```

## Environment

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `8080` | Port HTTP |
| `DATABASE_URL` | `postgres://bisapns:bisapns@localhost:5432/bisapns?sslmode=disable` | |
| `JWT_SECRET` | (string dev) | **Wajib diganti** di produksi |
| `APP_ENV` | `development` | `production` → mode release Gin, `dev_token` lupa password tidak dikirim |
| `CORS_ORIGINS` | `http://localhost:3000` | Dipisah koma |
| `UPLOAD_DIR` | `./uploads` | Disajikan di `/uploads/*` |
| `COOKIE_SECURE` | `false` | `true` bila di belakang HTTPS |
| `SEED` | – | `true` → jalankan seeder sebelum server start |

Server: timeout read-header 10 dtk, read 30 dtk, write 60 dtk, idle 120 dtk; graceful shutdown 15 dtk pada SIGINT/SIGTERM. Auto-submit attempt yang lewat batas waktu berjalan tiap 30 dtk; attempt kedaluwarsa juga difinalisasi saat diakses.

## Data seed

- Akun: `admin@bisapns.id / Admin123!`; `peserta1@bisapns.id` … `peserta3@bisapns.id / Peserta123!`.
- Kategori induk TWK/TIU/TKP + 16 sub-kategori.
- 110 soal terbit (30 TWK, 35 TIU, 45 TKP; 5 opsi + pembahasan) + 6 soal draft.
- Paket: **Tryout SKD Nasional #1** (110 soal, 100 menit, terbit, 65/80/166), **Tryout SKD Mini – TWK & TIU** (20 soal, 30 menit, terbit, 40/45/0, soal diacak), **Tryout SKD #2** (draft, kosong), **Tryout Akbar SKD CPNS 2027** (110 soal, terbit, jadwal besok 08.00–20.00 WIB → `belum_dibuka`).
- 7 riwayat ujian selesai (peserta1 lulus, peserta2 & peserta3 bervariasi/tidak lulus), waktu belajar 7 hari, 4 target harian hari ini per peserta, jawaban latihan, 2 pengumuman.

## Daftar endpoint

Semua di bawah `/api`; detail bentuk data di SPEC.md.

- Auth (publik): `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`
- Login: `GET /auth/me`, `PUT /me`, `PUT /me/password`, `GET /categories`, `GET /announcements`
- Peserta: `GET /me/dashboard`, `POST /me/heartbeat`, `GET|POST /me/targets`, `PATCH|DELETE /me/targets/:id`, `GET /me/results`, `GET /practice/questions`, `POST /practice/answer`, `GET /packages`, `GET /packages/:id`
- CBT: `POST /attempts`, `GET /attempts/:id`, `PUT /attempts/:id/answers`, `POST /attempts/:id/events`, `POST /attempts/:id/submit`, `GET /results/:id`
- Admin (`/admin`): `GET /dashboard`; `GET|POST /categories`, `PUT|DELETE /categories/:id`; `GET|POST /questions`, `GET /questions/template`, `GET /questions/export`, `POST /questions/import`, `GET|PUT|DELETE /questions/:id`; `POST /uploads`; `GET|POST /packages`, `GET|PUT|DELETE /packages/:id`, `PUT /packages/:id/questions`, `POST /packages/:id/auto-fill`, `PATCH /packages/:id/status`; `GET /users`, `GET /users/:id`, `GET /users/:id/export`, `PATCH /users/:id/status`, `POST /users/:id/reset-password`; `GET /reports/packages/:id`, `GET /reports/packages/:id/export`; `GET|POST /announcements`, `PUT|DELETE /announcements/:id`; `GET|PUT /settings`; `GET /activity`
- Lain: `GET /health`, file statis `/uploads/*`

CSV (template, export, laporan) memakai pemisah `;` dan BOM UTF-8 agar terbaca Excel berlocale Indonesia. Import menerima `;` atau `,` dan bersifat semua-atau-tidak (ada baris salah → 422 `IMPORT_ERROR`, `data.errors=[{row,message}]`).
