# Deploy ke cPanel (belajarcpns.web.id)

Hosting: cPanel + CloudLinux (Node.js Selector/Passenger, PostgreSQL 13, Terminal). Kode diambil dari GitHub
(`apriprogram/belajarcpns`) lewat **Git™ Version Control**. RAM/proses shared hosting tidak cukup untuk build Next.js,
jadi paket dibangun **GitHub Actions** (`.github/workflows/cpanel-build.yml`, rilis `cpanel-build`) setiap push ke `main`.
`deploy/cpanel/deploy.sh` (dipanggil `.cpanel.yml`) mengunduh paket untuk commit HEAD repo lalu memasangnya.

## Susunan di server
```
~/repositories/belajarcpns/          clone GitHub (cPanel Git Version Control)
~/public/belajarcpns.web.id/         document root = Application root Node.js App
  ├─ .htaccess                       blok BELAJARCPNS-PROTECT (tolak akses _app/, .env, server.js) + baris Passenger
  ├─ server.js                       peluncur: start API Go (127.0.0.1:API_PORT) lalu Next.js standalone
  ├─ package.json
  └─ _app/
     ├─ .env                         konfigurasi produksi (chmod 600, TIDAK di Git) — templat deploy/cpanel/env.template
     ├─ bin/bisapns-api, bin/watchdog.sh
     ├─ web/                         hasil build Next.js standalone
     ├─ data/uploads/                file unggahan (avatar, gambar soal)
     └─ logs/api.log, logs/watchdog.log
~/belajarcpns-deploy.log             log setiap deploy
```

## Pengaturan cPanel (sekali)
1. **Setup Node.js App**: Node 22, Production, Application root `public/belajarcpns.web.id`,
   URL `belajarcpns.web.id`, startup file `server.js`.
2. **PostgreSQL Databases**: DB `tanjunak_belajarcpns_db`, user `tanjunak_apriprogram` (ALL PRIVILEGES).
3. **Git Version Control**: clone `https://github.com/apriprogram/belajarcpns.git` ke `repositories/belajarcpns`.
4. Deploy pertama (lihat bawah) membuat `_app/.env`. Buka **File Manager** → `public/belajarcpns.web.id/_app/.env`
   → ganti `GANTI_PASSWORD_DB` dengan password user database → deploy/restart lagi.
5. **Cron Jobs** (tiap 5 menit) — menyalakan API bila mati:
   `*/5 * * * * /bin/sh $HOME/public/belajarcpns.web.id/_app/bin/watchdog.sh >/dev/null 2>&1`
6. **SSL/TLS Status** → Run AutoSSL. HTTPS & non-www dipaksa oleh `.htaccess`.

## Update rutin
1. Di laptop: commit & `git push` ke `main` → tunggu workflow **cpanel-build** hijau di tab Actions GitHub (±3–5 menit).
2. cPanel → Git Version Control → Manage → **Pull or Deploy** → **Update from Remote** → **Deploy HEAD Commit**.
   (Atau Terminal: `cd ~/repositories/belajarcpns && git pull && bash deploy/cpanel/deploy.sh`.)
3. Pantau `~/belajarcpns-deploy.log`. Migrasi database berjalan otomatis saat API start.

## Memindahkan data dari lokal
1. Lokal: `pg_dump --clean --if-exists --no-owner --no-acl --exclude-table-data=site_visits` → `db.sql` (hapus baris
   `CREATE/DROP/COMMENT ... EXTENSION pgcrypto`), ditambah folder `uploads/`, dikemas `belajarcpns-data.tar.gz`.
2. Upload arsip ke home (`~/`) lewat File Manager, lalu Terminal:
   `bash ~/repositories/belajarcpns/deploy/cpanel/restore-data.sh ~/belajarcpns-data.tar.gz` (menimpa DB produksi).
3. Hapus arsip setelahnya; **ganti password akun admin/demo** yang memakai password bawaan.

## Catatan
- `API_URL` dibaku saat build (`http://127.0.0.1:47391`, `env.API_PORT` di workflow). Ubah port → ubah workflow & `_app/.env` bersamaan.
- deploy.sh menunggu paket yang cocok dengan commit HEAD maksimal 20 menit (`DEPLOY_WAIT_MIN`).
- API hanya listen di `127.0.0.1` (`HOST`), tidak terbuka ke internet; semua akses lewat Next.js `/api/*`.
- `SEED=true` sekali saja untuk data contoh (akun `admin@bisapns.id / Admin123!` — **segera ganti password**),
  lalu kembalikan ke `false`.
- Negara pengunjung akurat bila domain diproksikan Cloudflare (`CF-IPCountry`), lihat `docs/VISITORS.md`.
