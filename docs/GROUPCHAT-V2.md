# GroupChat v2 — kontrak & perilaku (MENGIKAT untuk backend & frontend)

Melanjutkan GroupChat v1 (`apps/api/internal/app/chat_handlers.go`, `profanity.go`, migrasi `0004_group_chat`,
`apps/web/components/chat/GroupChat.jsx`). Semua teks UI berbahasa Indonesia. Respons API memakai envelope
standar `{ success, data, error:{code,message,fields}, meta }` (helper `httpx.*`), frontend memakai `api` dari `@/lib/api`
(`api.get/post/put/patch/del/upload`, `errorMessage(err)`; `ApiError` punya `.status` dan `.code`).

## Fitur baru
1. **Balas** pesan (quote): pesan menyimpan `reply_to`; gelembung menampilkan kutipan (nama + cuplikan / label lampiran), klik kutipan → gulir & sorot pesan asli bila sudah dimuat.
2. **Tag orang** (`@nama`): saat mengetik `@` muncul daftar anggota (`GET /chat/members?q=`); memilih menyisipkan `@Nama Lengkap ` dan menyimpan id-nya. Saat kirim, frontend mengirim `mentions` = id yang namanya masih ada di teks. `@Nama` di gelembung disorot (cobalt, tebal); gelembung yang menandai saya diberi aksen; tombol bulat (FAB) menampilkan indikator `@` bila ada tag untuk saya yang belum dibaca.
3. **Reaksi emoji** (gaya WhatsApp): bilah cepat `👍 ❤️ 😂 😮 😢 🙏` + tombol `+` (pemilih emoji lengkap). Satu reaksi per pengguna per pesan: memilih emoji yang sama = hapus, emoji lain = ganti. Chip di bawah gelembung: emoji + jumlah, chip milik saya disorot; tooltip/title berisi nama yang bereaksi; klik chip = toggle reaksi saya dengan emoji itu.
4. **Sematkan (pin) pesan — hanya admin**: maks 3 pesan tersemat (menyematkan yang ke-4 melepas yang paling lama). Banner di atas daftar pesan: ikon pin, "Pesan disematkan", nama pengirim, cuplikan; bila >1 tampil "1/3" dan klik berpindah ke berikutnya + gulir ke pesannya. Admin bisa melepas dari banner (×) atau dari menu aksi pesan. Pesan tersemat tidak ikut terhapus otomatis.
5. **Info "Pesan terhapus otomatis setelah N hari, kecuali yang berbintang." hanya untuk admin** (disembunyikan dari peserta).
6. **Pengaturan GroupChat** (halaman admin baru `/admin/chat`, menu sidebar grup "Sistem": label "GroupChat", ikon `MessagesSquare`) berisi switch untuk setiap fitur, default SEMUA aktif.
7. **Buka/tutup grup**: admin dapat menutup grup (peserta hanya membaca, hanya admin yang mengirim — seperti WA "hanya admin") dan dapat menonaktifkan GroupChat sepenuhnya untuk peserta. Admin tetap bisa membuka panel & mengirim kapan pun. Ada tombol cepat gembok di header panel chat (khusus admin).

## Pengaturan (`settings.key = 'chat_settings'`, JSONB)
```json
{
  "enabled": true,
  "peserta_can_send": true,
  "attachments": { "image": true, "video": true, "audio": true, "document": true },
  "links": true,
  "emoji": true,
  "reactions": true,
  "replies": true,
  "mentions": true,
  "stars": true,
  "user_delete": true,
  "profanity_filter": true,
  "auto_delete": true,
  "retention_days": 7
}
```
- Nilai yang tidak tersimpan memakai default di atas (unmarshal ke struct default). `retention_days` 1–90 (selain itu 422 dengan `fields.retention_days`).
- **Aturan berlaku**: `enabled`, `peserta_can_send`, `attachments.*`, `links`, `emoji`, `reactions`, `replies`, `mentions`, `stars`, `user_delete` **membatasi peserta saja**; admin (moderator) selalu bisa semua. `profanity_filter`, `auto_delete`, `retention_days` berlaku global.
- `emoji=false` → frontend menyembunyikan tombol pemilih emoji (server tidak menyaring emoji di teks).
- Key lama `settings.key='chat'` (`reset_at`) tetap dipakai untuk reset.

## Database — migrasi `0005_group_chat_v2`
- `chat_messages`: `reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL`, `mentions UUID[] NOT NULL DEFAULT '{}'`, `pinned_at TIMESTAMPTZ`, `pinned_by UUID REFERENCES users(id) ON DELETE SET NULL`; index parsial `WHERE pinned_at IS NOT NULL`.
- `chat_reactions(message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE, user_id UUID REFERENCES users(id) ON DELETE CASCADE, emoji VARCHAR(32) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(message_id, user_id))`.
- Setiap perubahan reaksi / pin / bintang / hapus **menaikkan `chat_messages.updated_at`** agar `/chat/sync` mengirim ulang pesan itu.

## Bentuk pesan (`ChatMessage` JSON)
```json
{
  "id": "uuid", "user": {"id":"uuid","name":"...","role":"peserta|admin"},
  "body": "...", "kind": "text|image|video|audio|file",
  "file": {"url":"/uploads/chat/x.png","name":"...","size":123,"mime":"..."} | null,
  "reply_to": {"id":"uuid","user_name":"...","body":"cuplikan ≤120 karakter","kind":"text|image|...","deleted":false} | null,
  "mentions": [{"id":"uuid","name":"..."}],
  "reactions": [{"emoji":"👍","count":2,"users":[{"id":"uuid","name":"..."}]}],
  "starred": false, "starred_by_name": null,
  "pinned": false, "pinned_at": null, "pinned_by_name": null,
  "deleted": false, "created_at": "RFC3339", "updated_at": "RFC3339"
}
```
- `reactions` diurutkan berdasarkan reaksi pertama (created_at); dimuat secara batch (tanpa N+1). Pesan terhapus: `reactions=[]`, `mentions=[]`, `file=null`, `reply_to` tetap boleh ada.
- Untuk pesan yang dibalas tetapi sudah terhapus: `reply_to.deleted=true`, `body=""`.

## Konfigurasi publik
`GET /api/chat/config` (semua pengguna login; **selalu 200**, juga saat dinonaktifkan):
```json
{ "enabled": true, "can_send": true, "is_admin": false, "retention_days": 7, "auto_delete": true,
  "features": { "attachments": {"image":true,"video":true,"audio":true,"document":true}, "links":true, "emoji":true,
                "reactions":true, "replies":true, "mentions":true, "stars":true, "user_delete":true } }
```
- Untuk admin: `enabled=true`, `can_send=true`, semua `features` true (admin tidak dibatasi), tetapi admin juga menerima `"group": { "enabled": <nilai asli>, "peserta_can_send": <nilai asli> }` untuk menampilkan status grup.
- Untuk peserta: `enabled` & `can_send` = nilai pengaturan (`can_send = enabled && peserta_can_send`); `features` = nilai pengaturan.

## Endpoint
Semua di bawah `/api`, butuh login (grup `authed`). "Peserta diblokir fitur" → **403** dengan code di bawah.
| Metode & path | Keterangan |
|---|---|
| `GET /chat/config` | lihat di atas |
| `GET /chat/messages?before=&limit=50` | seperti v1 + `pinned: ChatMessage[]` (tersemat aktif, urut `pinned_at` DESC, maks 3) + `config` (objek sama dengan `/chat/config`). Peserta & `enabled=false` → 403 `CHAT_DISABLED` |
| `GET /chat/sync?since=` | seperti v1 (`items`, `server_time`, `reset_at`, `purge_before`) + `pinned` + `config` + `has_more`. Server memakai overlap 2 dtk pada `since` dan maks 200 baris (urut `updated_at`); bila `has_more`, `server_time` = `updated_at` baris terakhir dan klien langsung sinkron lagi. `purge_before` = `null` bila `auto_delete=false`. Peserta & nonaktif → 403 `CHAT_DISABLED` |
| `GET /chat/members?q=` | anggota untuk @tag: pengguna `status <> 'blocked'`, `name ILIKE %q%`, urut nama, maks 20 → `[{id,name,role}]`. Peserta & nonaktif → 403 `CHAT_DISABLED` |
| `POST /chat/messages` (multipart) | field: `body`, `file` (opsional), `reply_to` (uuid, opsional), `mentions` (uuid dipisah koma, opsional). Lihat aturan kirim |
| `PATCH /chat/messages/:id/star` | v1; peserta & `stars=false` → 403 `CHAT_FEATURE_DISABLED` |
| `PUT /chat/messages/:id/reaction` `{ "emoji": "👍" }` | upsert reaksi saya; emoji sama dengan milik saya → hapus. Kembalikan `ChatMessage` terbaru. Peserta & `reactions=false` → 403 `CHAT_FEATURE_DISABLED`. Pesan terhapus/tidak ada → 404 |
| `DELETE /chat/messages/:id/reaction` | hapus reaksi saya → `ChatMessage` terbaru |
| `DELETE /chat/messages/:id` | v1; peserta & `user_delete=false` → 403 `CHAT_FEATURE_DISABLED` (admin selalu boleh) |
| `PATCH /admin/chat/messages/:id/pin` `{ "pinned": true }` | admin; maks 3 (yang paling lama dilepas). Kembalikan `{ "message": ChatMessage, "pinned": ChatMessage[] }` |
| `GET /admin/chat/settings` | `{ "settings": {...}, "stats": { "messages":N, "starred":N, "pinned":N, "files":N, "reactions":N, "members_7d":N } }` (statistik pesan tidak terhapus; `members_7d` = pengirim unik 7 hari) |
| `PUT /admin/chat/settings` | body = objek pengaturan **parsial atau lengkap**; key yang dikirim ditimpakan ke pengaturan tersimpan → validasi → simpan → `logActivity("groupchat.pengaturan", ringkasan perubahan)` → kembalikan `{settings}`. Panel (gembok) mengirim `{peserta_can_send}` saja; halaman pengaturan mengirim key yang berubah. Setelah sukses, frontend memancarkan event `bisapns:chat-settings` agar layar lain ikut memperbarui. |
| `POST /admin/chat/reset` | v1 (tetap) |

### Aturan kirim (`POST /chat/messages`) untuk peserta
- `enabled=false` → 403 `CHAT_DISABLED` "GroupChat sedang dinonaktifkan admin."
- `peserta_can_send=false` → 403 `CHAT_CLOSED` "Grup sedang ditutup. Hanya admin yang dapat mengirim pesan."
- Lampiran jenis yang dimatikan (`image|video|audio|file→document`) → 403 `CHAT_FEATURE_DISABLED` "Mengirim {gambar|video|audio|dokumen} sedang dinonaktifkan admin."
- `links=false` dan body berisi URL (`http://`, `https://`, atau `www.`) → 422 `fields.body` "Mengirim link sedang dinonaktifkan admin."
- `replies=false` dan `reply_to` diisi → 403 `CHAT_FEATURE_DISABLED`.
- `mentions=false` → `mentions` diabaikan (tidak disimpan).
- Berlaku untuk semua: `reply_to` harus pesan yang ada & belum dihapus (selain itu 422 `fields.reply_to`); `mentions`: uuid valid, unik, maks 10, hanya pengguna yang ada & tidak diblokir (sisanya dibuang diam-diam).
- `profanity_filter=true` → `censor()` pada body & nama file (seperti v1); false → tanpa sensor.

### Pembersihan otomatis
Janitor (tiap jam) membaca pengaturan: bila `auto_delete=true` hapus pesan `starred=false AND pinned_at IS NULL AND created_at < now() - retention_days`; jejak pesan terhapus > 1 hari tetap dibersihkan. Bila `auto_delete=false` hanya jejak terhapus yang dibersihkan.

## Frontend
- `components/chat/GroupChat.jsx` (dan file pendukung baru di `components/chat/`): semua fitur di atas, patuh `config`:
  - peserta & `!config.enabled` → tidak merender apa pun (FAB pun tidak); cek ulang `GET /chat/config` tiap 30 dtk agar muncul lagi saat diaktifkan. Admin selalu melihat chat; bila `config.group.enabled=false` tampilkan strip info "GroupChat nonaktif untuk peserta"; bila `config.group.peserta_can_send=false` strip "Grup ditutup — hanya admin yang dapat mengirim".
  - peserta & `!config.can_send` → komposer diganti bar gembok "Grup sedang ditutup. Hanya admin yang dapat mengirim pesan."
  - sembunyikan tombol/aksi sesuai `features` (lampiran: `accept` hanya jenis aktif, tombol klip hilang bila semua mati; emoji picker; reaksi; balas; tag; bintang; hapus pesan sendiri). Peringatan sebelum kirim bila ada URL dan `links=false`.
  - info retensi hanya bila `config.is_admin`.
  - header admin: tombol gembok (tutup/buka grup, `PUT /admin/chat/settings` dengan objek dari `GET /admin/chat/settings` yang `peserta_can_send` dibalik), tombol reset (sudah ada), pin.
  - `config` dari respons `messages`/`sync` menggantikan state config; tangani 403 `CHAT_DISABLED` (peserta) dengan menyembunyikan chat.
  - Pertahankan semua perilaku v1 (polling, pin panel ke kanan, unread, lampiran, hapus, bintang, reset, gaya visual).
- `app/(admin)/admin/chat/page.jsx` + view: halaman "GroupChat" — header, kartu statistik, bagian **Status grup** (switch "Aktifkan GroupChat untuk peserta", "Grup terbuka — peserta bisa mengirim"), **Lampiran** (gambar, video, audio, dokumen), **Interaksi** (balas, tag @, reaksi emoji, pemilih emoji, bintang, kirim link, peserta boleh menghapus pesan sendiri), **Moderasi** (filter kata kasar, hapus otomatis + input hari 1–90), **Zona berbahaya** (reset GroupChat dengan konfirmasi). Tombol "Aktifkan semua" & "Kembalikan default". Simpan otomatis per switch (optimistis, toast saat gagal & rollback); input hari disimpan saat blur/Enter. Pakai `Switch` dari `@/components/ui` (`checked`, `onChange(nextBool)`, `label`, `description`) dan pola halaman admin (`AdminPageHeader`, `Panel`, `StatTile` dari `@/components/admin/AdminUI`).
- `components/layout/AdminShell.jsx`: tambah item nav `{ href: '/admin/chat', label: 'GroupChat', icon: MessagesSquare, group: 'Sistem' }` sebelum "Pesan masuk".
