# Testimoni — kontrak (MENGIKAT)

Peserta menulis testimoni (bintang 1–5 + teks). Masuk ke panel admin sebagai **menunggu**. Admin memilih mana
yang **tampil** di halaman utama, bisa **mengedit** (teks & bintang) dan **menghapus**. Section "Testimoni" di
halaman utama berada **tepat di bawah section Fitur**, berjalan otomatis (marquee) dan bisa digulir manual.

## Database — migrasi `0008_testimonials`
```sql
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,  -- 1 testimoni per peserta
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,                   -- 20–500 karakter (validasi di handler, setelah trim)
  status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','hidden')),
  edited_by_admin BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,   -- sudah dilihat admin (untuk badge)
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_testimonials_status ON testimonials(status, published_at DESC);
```
Menghapus peserta (adminDeleteUser) otomatis menghapus testimoninya (CASCADE).

## Objek testimoni (JSON)
```js
{ id, rating, content, status: 'pending'|'published'|'hidden', edited_by_admin, is_read,
  created_at, updated_at, published_at,
  user: { id, name, avatar_url, gender } }          // admin juga mendapat user.email
```
Publik (`GET /api/testimonials`) HANYA: `{ id, rating, content, published_at, user: { name, avatar_url } }`.

## API
| Metode | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/testimonials` | publik | `{ items: [...published, urut published_at DESC, maks 40], average: number(1 desimal), total: int }` (average/total dari yang published). Header `Cache-Control: no-store`. |
| GET | `/api/me/testimonial` | peserta | `{ testimonial: <objek>|null }` |
| PUT | `/api/me/testimonial` | peserta | body `{ rating, content }` → buat / ubah milik sendiri. Ubah = status kembali `pending`, `is_read=false`, `edited_by_admin=false`, `published_at=null`. Validasi: rating int 1–5, content 20–500 karakter (pesan Indonesia, `httpx` fields). Rate limit ringan. Profanity → tolak (pakai `profanity.go` bila ada fungsi deteksi, kalau hanya masking: tolak bila hasil mask ≠ asli). → `{ testimonial }` |
| DELETE | `/api/me/testimonial` | peserta | hapus milik sendiri → `{ ok: true }` |
| GET | `/api/admin/testimonials` | admin | `?status=semua|pending|published|hidden` `?q=` (nama/email/isi) → `{ items, counts: { semua, pending, published, hidden }, unread }` urut created_at DESC |
| GET | `/api/admin/testimonials/unread` | admin | `{ unread }` (status pending & is_read=false) |
| PATCH | `/api/admin/testimonials/:id` | admin | body opsional `{ rating?, content?, status? }`. content/rating diubah → `edited_by_admin=true`. status→published set `published_at=now()` (bila sebelumnya null/bukan published). Selalu set `is_read=true`. → `{ testimonial }`. `logActivity("testimoni.ubah", ...)` |
| POST | `/api/admin/testimonials/read-all` | admin | tandai semua dibaca |
| DELETE | `/api/admin/testimonials/:id` | admin | hapus → `{ ok: true }`. `logActivity("testimoni.hapus", ...)` |

## Frontend
- **Peserta**: halaman `/testimoni` (app/(peserta)/testimoni) memakai `PageHead` (mascot `/maskot/dashboard.webp`), form bintang interaktif (hover, keyboard ←/→, aria radiogroup), textarea dengan penghitung 20–500, status chip (Menunggu ditinjau / Ditampilkan / Disembunyikan), tombol Simpan & Hapus (konfirmasi). Pratinjau kartu seperti tampil di website. Link di `UserMenu` (peserta) "Tulis testimoni" + kartu ajakan kecil di dashboard + entri QuickSearch.
- **Admin**: halaman `/admin/testimoni` (menu "Testimoni", ikon `MessageSquareQuote`, grup "Peserta & Hasil", badge merah jumlah unread seperti "Pesan masuk"). Tab status dengan jumlah, cari, kartu/tabel: avatar+nama+email, bintang, isi (dipotong), tanggal, chip status, **Switch "Tampilkan"** (published ⇄ hidden; dari pending → published), tombol Edit (modal: bintang + textarea) & Hapus (konfirmasi). Buka halaman → `read-all`.
- **Landing**: section `id="testimoni"` di bawah Fitur. `sections.testimoni = { visible: true, index: '02', label: 'Kata peserta', title: 'Testimoni', description: 'Cerita mereka yang sudah berlatih di sini.' }`, navbar link `{ id: 'testimoni', label: 'Testimoni' }` setelah Fitur. Indeks section lain bergeser (skd 03, langkah 04, faq 05, kontak 06). Data dari `GET /api/testimonials` (client fetch). Kosong → section menampilkan ajakan "Jadilah yang pertama" + tombol Masuk/Daftar (bukan disembunyikan). Marquee 2 baris berlawanan arah (1 baris bila < 6 item), pause saat hover/fokus/drag, bisa digeser (scroll horizontal / drag / tombol ‹ ›), `prefers-reduced-motion` → tanpa animasi. Ringkasan: rata-rata ★ + jumlah ulasan.
- **Fitur**: tambah item default `{ tag: 'Komunitas', image: '/landing/fitur-groupchat.jpg', title: 'Live Group Chat', description: 'Forum diskusi, info terbaru, dan berbagi tips bersama peserta lain secara langsung.' }`.
