# Uji Beban (k6) — 500 Peserta Serentak

Skenario `k6-submit.js`: setiap peserta virtual (VU) **login → mulai tryout → simpan 20 jawaban → submit**.
Target (thresholds): **p95 waktu respons < 800 ms** dan **error rate < 1 %**.

## 1. Prasyarat
- Aplikasi berjalan (mis. `docker compose up -d --build`) dan **minimal satu paket tryout berstatus terbit** (seed sudah menyediakan 1 paket).
- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) terpasang
  (Windows: `winget install k6 --source winget` · Mac: `brew install k6` · atau Docker `grafana/k6`).

## 2. Buat 500 akun loadtest
Akun: `loadtest1@bisapns.id` … `loadtest500@bisapns.id`, password **`Peserta123!`**.
Semua akun memakai hash bcrypt yang sama (cost 12, sudah diverifikasi dengan `golang.org/x/crypto/bcrypt`):

```
$2b$12$h6aMH4B9QGU6IrsAAq7LJuiCaBqbRcw0sYUnCJeB5IVafilKITPAK
```

SQL tersedia di `tests/load/seed-loadtest.sql`:

```sql
INSERT INTO users (name, email, phone, password_hash, role, status)
SELECT 'Peserta Loadtest ' || g,
       'loadtest' || g || '@bisapns.id',
       '0800' || lpad(g::text, 8, '0'),
       '$2b$12$h6aMH4B9QGU6IrsAAq7LJuiCaBqbRcw0sYUnCJeB5IVafilKITPAK',
       'peserta', 'active'
FROM generate_series(1, 500) AS g
ON CONFLICT (email) DO NOTHING;
```

Jalankan lewat container database:

```bash
# Linux/Mac/Git Bash
docker compose exec -T db psql -U bisapns -d bisapns < tests/load/seed-loadtest.sql
```
```powershell
# Windows PowerShell
Get-Content tests\load\seed-loadtest.sql | docker compose exec -T db psql -U bisapns -d bisapns
```

Verifikasi: `docker compose exec db psql -U bisapns -d bisapns -c "select count(*) from users where email like 'loadtest%';"` → `500`.

## 3. Jalankan
```bash
k6 run tests/load/k6-submit.js
# opsi
k6 run -e BASE_URL=http://localhost:8080 -e VUS=500 -e ANSWERS=20 -e PACKAGE_ID=<uuid-paket> tests/load/k6-submit.js
# via Docker (Windows/Mac: host.docker.internal)
docker run --rm -i -e BASE_URL=http://host.docker.internal:8080 grafana/k6 run - < tests/load/k6-submit.js
```

| Env | Default | Keterangan |
|---|---|---|
| `BASE_URL` | `http://localhost:8080` | API langsung; bisa juga lewat web `:3000` atau domain produksi |
| `VUS` | `500` | Jumlah peserta virtual (pastikan akun loadtest sebanyak ini ada) |
| `PACKAGE_ID` | otomatis | Paket pertama berstatus `tersedia` |
| `ANSWERS` | `20` | Jawaban yang disimpan per peserta |
| `THINK_MIN`/`THINK_MAX` | `1`/`3` | Jeda antar-jawaban (detik) |
| `START_SPREAD` | `30` | Login peserta disebar acak dalam N detik (`0` = benar-benar serentak) |

## 4. Catatan penting
- **Rate limit login**: API membatasi percobaan login per IP. Karena semua VU berasal dari satu IP, jalankan uji beban terhadap lingkungan `APP_ENV=development`/staging atau naikkan batas rate limit sementara. Error 429 akan terhitung sebagai kegagalan.
- Satu peserta hanya boleh punya satu attempt berlangsung; jika uji diulang, attempt yang masih berjalan akan **dilanjutkan** (`resumed: true`) — ini normal.
- Bcrypt cost 12 sengaja mahal (±250 ms/login per core). Lonjakan 500 login serentak adalah bagian paling berat; perhatikan metrik `http_req_duration{name:login}` terpisah dari `answer_save`/`attempt_submit`.
- Laporkan hasil: salin ringkasan akhir k6 (`http_req_duration p(95)`, `http_req_failed`, `bisa_attempts_submitted`) ke `CHANGELOG.md`/laporan rilis.

## 5. Bersihkan akun loadtest
```sql
DELETE FROM users WHERE email LIKE 'loadtest%@bisapns.id';
```
(attempt/hasil ikut terhapus bila FK `ON DELETE CASCADE`.)
