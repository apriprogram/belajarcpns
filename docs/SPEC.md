# BISA-PNS — Spesifikasi Bersama (kontrak antar divisi)

Root repo: `/home/claude/bisa-pns`
- `apps/api` — Go 1.24 + Gin + pgx/v5 (PostgreSQL). Modul `bisapns/api`.
- `apps/web` — Next.js 15 App Router, **JavaScript/JSX (bukan TS)**, Tailwind CSS v3, `tailwind.config.js`.
- Semua teks UI **Bahasa Indonesia**.

## Lingkungan dev
- API: `http://localhost:8080`, semua endpoint di bawah `/api`. File upload di `/uploads/*`.
- Web: `http://localhost:3000`. `next.config.mjs` me-*rewrite* `/api/:path*` dan `/uploads/:path*` ke `API_URL` (default `http://localhost:8080`) sehingga cookie same-origin.
- PostgreSQL: `postgres://bisapns:bisapns@localhost:5432/bisapns?sslmode=disable`.
- Akun seed: admin `admin@bisapns.id` / `Admin123!`; peserta `peserta1@bisapns.id` … `peserta3@bisapns.id` / `Peserta123!`.

## Auth
- Login/daftar/refresh men-set cookie httpOnly `access_token` (JWT HS256, 15 menit, claims: `sub`, `role`, `name`, `exp`) dan `refresh_token` (7 hari).
- Klien: semua fetch `credentials: 'include'`. Jika respons 401 → panggil `POST /api/auth/refresh` sekali lalu ulangi request; jika gagal → redirect `/login`.
- Middleware Next.js: rute `/dashboard`, `/latihan`, `/tryout`, `/ujian`, `/hasil`, `/riwayat`, `/profil` butuh login (cookie `access_token` atau `refresh_token` ada). `/admin/*` butuh role admin (decode payload JWT `access_token` tanpa verifikasi hanya untuk routing; jika access expired tapi refresh ada, biarkan lewat — API tetap jadi penjaga keamanan). Peserta yang buka `/admin` → `/dashboard`. Admin yang login diarahkan ke `/admin`.

## Format respons
```json
{ "success": true, "data": ..., "error": null, "meta": {"page":1,"per_page":10,"total":42,"total_pages":5} }
{ "success": false, "data": null, "error": {"code":"VALIDATION_ERROR","message":"...","fields":{"email":"..."}} }
```
Kode error penting: `UNAUTHORIZED`, `TOKEN_EXPIRED` (401), `FORBIDDEN` (403), `NOT_FOUND`, `VALIDATION_ERROR` (422, ada `fields`), `CONFLICT` (409), `TIME_UP` (409), `ATTEMPT_FINISHED` (409), `TOO_MANY_REQUESTS` (429), `IMPORT_ERROR` (422, `data.errors=[{row,message}]`).
Pagination: query `?page=&per_page=`.

## Endpoint & bentuk data

### Auth (publik)
- `POST /api/auth/register` `{name,email,phone,password,password_confirm}` → User
- `POST /api/auth/login` `{email,password}` → User
- `POST /api/auth/refresh` → User · `POST /api/auth/logout`
- `POST /api/auth/forgot-password` `{email}` → `{message, dev_token?}` (dev_token hanya mode development)
- `POST /api/auth/reset-password` `{token,password,password_confirm}`
- `GET /api/auth/me` → User · `PUT /api/me` `{name,phone}` · `PUT /api/me/password` `{current_password,password,password_confirm}`

User: `{id,name,email,phone,role:"admin"|"peserta",status:"active"|"blocked",last_seen_at,created_at}`

### Umum (login)
- `GET /api/categories` → `[{id,parent_id,code:"TWK"|"TIU"|"TKP",name,question_count}]` (parent_id null = kategori induk subtes)
- `GET /api/announcements` → `[{id,title,body,published,created_at}]` (yang terbit)

### Peserta
- `GET /api/me/dashboard` →
```json
{ "study": { "days": [{"day":"2026-10-06","label":"Sen","minutes":42}], "today_minutes":30, "yesterday_minutes":20, "week_minutes":180, "change_pct": 50 },
  "stats": { "avg_score": 412.5, "best_score": 455, "attempts_done": 4, "packages_available": 3, "pass_rate": 75, "practice_answered": 120, "practice_accuracy": 68 },
  "upcoming": [{"id":"..","title":"..","start_at":"..","end_at":"..","duration_minutes":100,"question_count":110}],
  "targets_today": [Target], "announcements": [Announcement], "latest_result": ResultSummary|null }
```
- `POST /api/me/heartbeat` `{seconds:60}` (maks 120) — dipanggil tiap 60 dtk di halaman latihan & ujian untuk mencatat waktu belajar.
- Target: `{id,title,subtest,due_time:"09:00",priority:"rendah"|"sedang"|"tinggi",day:"2026-10-12",done}`
  `GET /api/me/targets?day=YYYY-MM-DD` · `POST /api/me/targets` · `PATCH /api/me/targets/:id` (field parsial) · `DELETE /api/me/targets/:id`
- `GET /api/me/results?page=` → `[ResultSummary]` + meta. ResultSummary: `{attempt_id,package_id,package_title,score_twk,score_tiu,score_tkp,score_total,correct_count,wrong_count,empty_count,passed,duration_seconds,created_at}`
- Latihan: `GET /api/practice/questions?subtest=TWK&category_id=&limit=10` → `[{id,subtest,category_name,body,image_url,difficulty,options:[{id,label,body}]}]` (tanpa bobot)
  `POST /api/practice/answer` `{question_id,option_id}` → `{is_correct,score,max_weight,correct_option_id,explanation,options:[{id,label,body,weight}]}`
- Paket: `GET /api/packages` → `[Package]`, `GET /api/packages/:id` → Package
  Package (peserta): `{id,title,description,duration_minutes,start_at,end_at,question_count,counts:{TWK,TIU,TKP},pass_twk,pass_tiu,pass_tkp,pass_total,shuffle_questions,availability:"tersedia"|"belum_dibuka"|"ditutup",active_attempt_id|null,attempts_count,last_result:{attempt_id,score_total,passed}|null}`
- Ujian CBT:
  - `POST /api/attempts` `{package_id}` → `{attempt_id, resumed}` (jika ada attempt berlangsung → dilanjutkan)
  - `GET /api/attempts/:id` → `{id,status:"berlangsung"|"selesai",package:{id,title,duration_minutes},started_at,deadline_at,server_time,remaining_seconds,questions:[{id,position,subtest,body,image_url,options:[{id,label,body}]}],answers:{"<question_id>":{"option_id":"..|null","is_flagged":false}}}`. Label opsi yang dikirim sudah urutan tampil (A–E) walau diacak. **Tidak pernah berisi bobot/kunci**. Jika status `selesai` → front-end redirect ke `/hasil/:id`.
  - `PUT /api/attempts/:id/answers` `{question_id,option_id|null,is_flagged}` → `{saved_at,remaining_seconds}`; jika waktu habis → 409 `TIME_UP` (attempt otomatis difinalisasi).
  - `POST /api/attempts/:id/events` `{type:"tab_hidden"|"blur"|"fullscreen_exit"}`
  - `POST /api/attempts/:id/submit` → `{attempt_id, result: ResultSummary}`
- `GET /api/results/:attemptId` →
```json
{ "attempt_id":"..","package":{"id":"..","title":"..","pass_twk":65,"pass_tiu":80,"pass_tkp":166,"pass_total":0},
  "user":{"name":".."}, "score_twk":..,"score_tiu":..,"score_tkp":..,"score_total":..,"correct_count":..,"wrong_count":..,"empty_count":..,
  "passed":true,"duration_seconds":3600,"rank":3,"participants":12,"submitted_at":"..",
  "max":{"TWK":150,"TIU":175,"TKP":225},
  "review":[{"position":1,"question_id":"..","subtest":"TWK","category_name":"..","body":"..","image_url":"","explanation":"..","chosen_option_id":"..|null","score":5,"max_weight":5,"status":"benar"|"salah"|"kosong","options":[{"id":"..","label":"A","body":"..","weight":5}]}] }
```
  Hanya pemilik attempt atau admin; hanya jika status selesai (selain itu 409 `ATTEMPT_NOT_FINISHED`).

### Admin (`/api/admin/*`, role admin)
- `GET /dashboard` → `{totals:{peserta,online,active_today,questions,questions_published,packages,packages_published,attempts,attempts_today,avg_score,pass_rate}, activity:[{day,label,attempts,registrations}] (14 hari), by_subtest:{TWK,TIU,TKP} (jumlah soal), recent_results:[{attempt_id,user_name,package_title,score_total,passed,created_at}], top_packages:[{id,title,attempts,avg_score}]}`
- Kategori: `GET/POST /categories` `{code,name}`, `PUT/DELETE /categories/:id`
- Soal: `GET /questions?q=&subtest=&category_id=&difficulty=&status=&page=&per_page=&with_options=1`, `GET/PUT/DELETE /questions/:id`, `POST /questions`
  Question: `{id,subtest,category_id,category_name,body,image_url,difficulty:"mudah"|"sedang"|"sulit",explanation,status:"draft"|"terbit",options:[{id,label,body,weight}],used_in_packages,created_at,updated_at}`
  Input: `{subtest,category_id,body,image_url,difficulty,explanation,status,options:[5 x {body,weight}]}`. Aturan: TWK/TIU tepat satu opsi bobot 5 (lainnya 0); TKP setiap opsi bobot 1–5. Error fields: `body`, `subtest`, `options`, `options.A` … `options.E`.
  `GET /questions/template` (CSV ; ), `GET /questions/export` (CSV), `POST /questions/import` (multipart `file`) → `{inserted, errors:[]}` atau 422 IMPORT_ERROR.
  `POST /uploads` (multipart `file`, gambar ≤2MB) → `{url:"/uploads/xxx.png"}`
- Paket: `GET /packages?q=&status=&page=` → `[AdminPackage]`; `POST /packages`; `GET/PUT/DELETE /packages/:id`
  AdminPackage: `{id,title,description,duration_minutes,start_at,end_at,shuffle_questions,shuffle_options,status:"draft"|"terbit"|"arsip",pass_twk,pass_tiu,pass_tkp,pass_total,question_count,counts:{TWK,TIU,TKP},attempts_count,created_at,updated_at}`; detail juga `questions:[{id,position,subtest,category_name,body,difficulty,status}]`
  Input: `{title,description,duration_minutes,start_at|null,end_at|null,shuffle_questions,shuffle_options,pass_twk,pass_tiu,pass_tkp,pass_total}`
  `PUT /packages/:id/questions` `{question_ids:[...]}` (urutan = posisi) · `POST /packages/:id/auto-fill` `{twk:30,tiu:35,tkp:45}` (acak dari soal terbit, mengganti isi) · `PATCH /packages/:id/status` `{status}` (terbit butuh ≥1 soal)
- Peserta: `GET /users?q=&status=&page=` → `[User + {attempts_count,avg_score}]`; `GET /users/:id` → `{user,summary:{attempts,avg_score,best_score,passed,failed,tab_switches,study_minutes},history:[ResultSummary]}`; `GET /users/:id/export` (CSV); `PATCH /users/:id/status` `{status:"active"|"blocked"}`; `POST /users/:id/reset-password` → `{temp_password}`
- Laporan: `GET /reports/packages/:id` → `{package:AdminPackage, summary:{participants,avg_total,max_total,min_total,pass_rate,avg_twk,avg_tiu,avg_tkp}, distribution:[{range:"0-99",count}], ranking:[{rank,attempt_id,user_name,email,score_twk,score_tiu,score_tkp,score_total,passed,created_at}], items:[{question_id,position,subtest,body,answered,correct,pct_correct,flag:"terlalu_mudah"|"terlalu_sulit"|null}]}`; `GET /reports/packages/:id/export` (CSV)
- Pengumuman: `GET/POST /announcements`, `PUT/DELETE /announcements/:id` `{title,body,published}`
- Pengaturan: `GET/PUT /settings` → `{passing_grade:{twk:65,tiu:80,tkp:166,total:0}, default_duration:100, composition:{twk:30,tiu:35,tkp:45}}`
- `GET /activity?page=` → `[{id,user_name,action,detail,created_at}]`

### Penilaian SKD
TWK 30 soal & TIU 35 soal: benar=5, salah/kosong=0. TKP 45 soal: bobot opsi 1–5. Total 110 soal, 100 menit. Lulus jika TWK≥pass_twk, TIU≥pass_tiu, TKP≥pass_tkp, total≥pass_total. Skor maks: TWK 150, TIU 175, TKP 225, total 550.

---

## Design system — "Order. Balance. Clarity."
Gambar referensi (lihat dengan Read tool): `/root/.claude/uploads/befd3800-c671-5caf-b277-f1022d1a82ed/` → `82918643-image.png` (dashboard kalender/total time/attendance gauge/daily tasks), `ea1a9d6b-image.png` (kartu angka besar + kartu proyek dengan checklist bersegmen), `710dc219-image.png` (bento card hijau lembut), `1e5aa065-image.png` (kartu putih besar radius besar, topbar pill, glow biru di header), `8fbec39a-image.jpg` (chip metadata tint), `96489d84-image.jpg` (5 state input), `e8b68f5b-image.jpg` (tabel + modal detail).

Token warna (Tailwind `colors`):
- `mint` `#70FC8E` (+ `mint-50 #ECFFF0`, `mint-100 #D4FEDC`, `mint-700 #14833A` untuk teks hijau di latar terang)
- `cobalt` `#3765F6` (+ `cobalt-50 #EEF2FF`, `cobalt-100 #DCE5FE`, `cobalt-600 #2A52D6`, `cobalt-700 #1F3FB0`)
- `mist` `#C3CED7` (+ `mist-50 #F5F7F9`, `mist-100 #E7ECF0`, `mist-500 #8A99A6`, `mist-700 #5B6875`)
- `ghost` `#F2F3F6`
- `obsidian` `#181D25` (+ `obsidian-800 #252B35`, `obsidian-600 #4A5260`)
- status: `danger #E5484D` (`danger-50 #FFF0F0`), `warning #F5B301` (`warning-50 #FFF8E1`, teks `#9A6B00`)
Komposisi ±80% netral, 15% cobalt, 5% mint. Teks di atas mint SELALU obsidian. Satu-satunya gradien: glow cobalt lembut (radial, opacity rendah) di header halaman utama.

Tipografi: Inter (`next/font/google`), angka besar `tabular-nums`, timer/nomor soal/kode pakai `font-mono` (JetBrains Mono via next/font).
Bentuk: card `rounded-[28px]` putih, shadow `0 1px 2px rgba(24,29,37,.04), 0 8px 24px rgba(24,29,37,.04)`, padding 24–32px; chip `rounded-full` / `rounded-2xl` latar tint; tombol pill; tombol ikon bulat 40px putih; input `rounded-2xl` tinggi 48px dengan 5 state (disabled, default, focus ring cobalt, success, error + ikon + pesan).
Ikon: `lucide-react`. Chart: SVG custom ringan (LineChart, BarChart, Gauge setengah lingkaran) — tanpa library chart berat.

### Komponen bersama (`apps/web/components/ui/*`, diekspor dari `components/ui/index.js`)
Button (variant: primary=obsidian, accent=cobalt, secondary, ghost, danger; size sm/md/lg; loading; icon), IconButton, Card (+CardHeader title/subtitle/action), StatCard (label, value besar, icon, trend), Chip (color: cobalt/mint/warning/danger/mist/obsidian, icon), Badge (status: lulus/berlangsung/menunggu/gagal/draft/terbit/arsip/aktif/diblokir), Input, Textarea, Select, Checkbox, Switch, Field (label, hint, error, success), Tabs (pill), SegmentedProgress, ProgressBar, Gauge, LineChart, BarChart, Modal, ConfirmDialog, Table (Th/Td helpers, sticky header), Pagination, EmptyState, Skeleton, Spinner, Avatar (inisial), Toast (`useToast()` lewat ToastProvider), Dropdown/Menu titik tiga, SearchInput.
Utilitas: `lib/api.js` (`api.get/post/put/patch/del/upload`, `ApiError` dengan `.status .code .fields`), `lib/format.js` (formatTanggal id-ID, durasi, angka), `lib/auth.js`/`AuthProvider` (`useAuth()` → `{user, loading, refresh, logout}`), `cn()`.

### Peta halaman
Publik: `/` landing, `/login`, `/daftar`, `/lupa-password`, `/reset-password?token=`.
Peserta (layout topbar pill, konten max-w-7xl): `/dashboard`, `/latihan`, `/tryout`, `/tryout/[id]` (instruksi + mulai), `/ujian/[attemptId]` (layout fokus TANPA navigasi), `/hasil/[attemptId]`, `/riwayat`, `/profil`.
Admin (sidebar obsidian ringkas + topbar): `/admin`, `/admin/soal`, `/admin/soal/baru`, `/admin/soal/[id]`, `/admin/paket`, `/admin/paket/[id]`, `/admin/peserta`, `/admin/laporan`, `/admin/pengumuman`, `/admin/pengaturan`.
Lain: `/design-system`, `not-found`, `error`.
