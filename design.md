# design.md — Panduan desain BELAJAR CPNS

Sumber kebenaran tampilan web `apps/web` (Next.js 15 + Tailwind 3.4). Rinciannya: token di
`apps/web/tailwind.config.js`, kelas global di `apps/web/app/globals.css`, gaya komponen di
`docs/STYLE-UI-V2.md`, kontrak halaman di `docs/SPEC.md`. **Jangan ganti palet atau font.**

Konsep: **"Order. Balance. Clarity."**, yaitu gaya **"Calm Workspace"**. Tampilannya datar dan hampir tanpa shadow, ruangnya lega,
dan setiap kartu punya satu fokus.

---

## 1. Warna (token Tailwind)

| Token | Hex | Peran |
|---|---|---|
| `obsidian` | #181D25 (`800` #252B35, `600` #4A5260) | Teks utama, tombol primer, latar gelap |
| `cobalt` | #3765F6 (`50` #EEF2FF, `100` #DCE5FE, `600` #2A52D6, `700` #1F3FB0) | Aksi utama, tautan, ring fokus, garis grafik |
| `mint` | #70FC8E (`50` #ECFFF0, `100` #D4FEDC, `700` #14833A) | Sukses/lulus, highlight kecil; teks di atasnya **selalu obsidian** |
| `mist` | #C3CED7 (`50` #F5F7F9, `100` #E7ECF0, `500` #8A99A6, `700` #5B6875) | Garis, divider, placeholder, teks sekunder (`mist-700`) |
| `ghost` | #F2F3F6 | Latar halaman, permukaan sekunder |
| `danger` | #E5484D (`50`, `700`) | Error, waktu hampir habis, hapus |
| `warning` | #F5B301 (`50`, `700`) | Ragu-ragu, menunggu |

- Komposisi ±80% netral, ±15% cobalt, ±5% mint. Tidak ada gradien warna-warni. Satu-satunya gradien adalah glow cobalt lembut di header/hero.
- Kontras teks minimal WCAG AA. Teks sekunder memakai `text-mist-700`, bukan `mist-500` (mist-500 hanya untuk placeholder dan ikon).

## 2. Tipografi

- **Inter** (variabel, self-host `next/font/local` → `font-sans`) untuk semua teks.
- **JetBrains Mono** (`font-mono`) untuk timer, nomor soal, kode, dan badge nomor section.
- Judul 600 dengan tracking rapat. Body 400–500. Angka statistik memakai `tabular-nums`.

### Token font (HP lebih ringkas)
Ukuran bernama Tailwind (`text-xs` … `text-4xl`) memakai CSS variable (`tailwind.config.js` → `fontSize`, nilai di
`app/globals.css`). Desktop = default Tailwind; **di HP (< 640px) otomatis lebih kecil** tanpa kelas tambahan:

| Kelas | Desktop | HP |
|---|---|---|
| `text-xs` | 12px | 12px |
| `text-sm` | 14px | **13px** |
| `text-base` | 16px | **15px** |
| `text-lg` | 18px | **16px** |
| `text-xl` | 20px | **18px** |
| `text-2xl` | 24px | **20px** |
| `text-3xl` | 30px | **24px** |
| `text-4xl` | 36px | **28px** |

Ukuran px tertulis langsung (`text-[15px]` dll.) tidak ikut berubah, jadi beri nilai HP sendiri (base = HP, `sm:` = desktop).
**Input/textarea wajib `max-sm:text-[16px]`** (bukan `text-base`, karena di HP `text-base` = 15px → iOS auto-zoom).
Alat ukur: skrip `~/.claude/skills/design-system/scripts/mobile_audit.js` (lihat §7).

### Skala per layar
Basis = HP (< 640px); `sm:` (≥ 640px) dan seterusnya = nilai desktop. Preferensi pengguna: **tampilan HP ringkas**.

| Elemen | HP (< 640) | ≥ 640 / desktop |
|---|---|---|
| H1 hero landing | 24px, lh 1.2, tracking -0.02em | `sm:` 60px → `xl:` 72px |
| H2 judul section & CTA gelap | 20px (`text-2xl`), lh 1.2 | `sm:` 48–60px → `xl:` 56px |
| Judul kartu fitur besar / kartu langkah | 18px (`text-xl`) | `sm:` 30px → `lg:` 40px |
| Judul kartu biasa / kartu artikel | 15px (`text-base`) | `sm:` 20px |
| Deskripsi landing (checklist hero, deskripsi section, kartu fitur utama, subjudul CTA) | 14px, lh 1.6 | 17–18px |
| Teks kartu landing (fitur, langkah, testimoni, jawaban FAQ) | 13px (`text-sm`) | 15px |
| Tombol (semua ukuran md/lg/xl) | **40px, teks 13px** (area sentuh ±48px) | 44 / 48 / 56px |
| Tombol kecil (sm), tombol navbar landing | 32px, teks 12px (area sentuh ±44px) | 36 / 44px |
| Tab / segmen / tab TRYOUT-LATIHAN | 32px, teks 11–12px | 36px |
| Ikon bulat topbar panel | 36px (area sentuh 44px) | 44px |
| Logo | tanda 32px, nama 15px | 36px, 17px |
| H1 halaman panel (admin & peserta) | 20px | 28–30px |
| Judul panel/kartu panel | 14px semibold | 15px |
| Body panel | 13px (`text-sm`) | 14px |
| Caption / label / header tabel | 12px (header tabel 11px uppercase) | 12–13px |
| Angka statistik (StatTile, kit, dashboard) | 22px | 30–32px |
| Skor besar hasil ujian / timer | 32px / 28px | 56px / 44px |
| Teks soal & pembahasan | 14–15px | 15–18px |
| Input / textarea / select | **16px** (anti auto-zoom iOS) | 15px |
| Minimum teks fungsional | 11px | 11px (10px hanya untuk ilustrasi dekoratif) |

## 3. Spacing, radius, shadow

- Kelipatan 4/8px.
- Gutter `container-wide`: `px-5 sm:px-8 lg:px-12 2xl:px-16`. Main panel memakai `px-4 sm:px-6 lg:px-8`.
- Section landing (`.section-screen`): `py-12 sm:py-20`, dan setinggi satu layar (`min-h-[100svh]`) hanya di `lg:`.
- Padding kartu: HP 16–20px, desktop 24–32px. Gap grid: HP 12–16px, desktop 20–24px.
- Radius:
  - panel/kartu `rounded-[20px]`
  - kartu landing `rounded-[24px]` (token `card` 28px)
  - kontrol `rounded-xl`
  - pill `rounded-full`
  - modal `rounded-[24px]` (bottom-sheet di HP: `rounded-t-[24px]`)
- Shadow: tanpa shadow untuk permukaan biasa (pakai `ring-1 ring-inset ring-mist-100`). `shadow-float` HANYA untuk lapisan melayang (modal, dropdown, popover, toast).

## 4. Komponen (`components/ui`)

| Komponen | Aturan |
|---|---|
| Button | `primary` obsidian, `accent` cobalt, `mint`, `secondary` putih + ring, `soft` ghost, `ghost`, `danger`. Ukuran desktop: sm 36 · md 44 · lg 48 · xl 56. **Di HP otomatis**: sm 32 (teks 12px) · md/lg/xl 40 (teks 13px), plus area sentuh tak terlihat (`after:`) ±44–48px. Landing & nav memakai `shape="pill"`. Jangan menimpa tinggi di HP lewat `className` biasa (bentrok dengan kelas `max-sm:` bawaan); kalau terpaksa pakai `max-sm:!h-8` dsb. |
| IconButton | xs 28 · sm 32 · md 40 · lg 48 — **sama di HP, jangan diperbesar** (`max-sm:!h-10` sudah dihapus). Di HP xs/sm/md diberi **area sentuh tak terlihat** +4px tiap sisi (`max-sm:before:absolute max-sm:before:-inset-1`). Label (aria) wajib. |
| Input/Select/Textarea | h-11 (md; lg 48 → 44px di HP), `rounded-xl`, garis mist-100, fokus cobalt, error danger + pesan. Teks **16px di HP** (`max-sm:text-[16px]` di `_field.js`). Pakai `type`/`inputMode`/`autoComplete`/`enterKeyHint` yang tepat. |
| Switch | track 36×20 (sm 28×16); di HP area sentuh diperluas `before:-inset-3`. |
| SegmentedControl / Segmented / Tabs | kontainer `bg-ghost p-1 rounded-xl`, item aktif putih + ring. **Di HP item 32px, teks 12px** + area sentuh vertikal (`after:-inset-y-1.5`), digulir horizontal di kontainernya sendiri (`max-sm:overflow-x-auto no-scrollbar`). |
| Modal | header + divider + body + footer kanan. Di HP berbentuk bottom-sheet, padding 20px, `pb-[env(safe-area-inset-bottom)]`, dan tombol footer bertumpuk (`flex-col-reverse`). Latar tanpa blur (`bg-obsidian/30`). |
| Tabel | dibungkus kartu; header `bg-ghost text-[11px] uppercase`. **Di HP (< 768px) tampil sebagai kartu bertumpuk** (contoh: Riwayat), atau tabel dibungkus `overflow-x-auto` di dalam kartu. Halaman tidak boleh ikut melebar. |
| Pagination | tombol 32px (desktop & HP); input lompat halaman 36px, teks 16px di HP. |
| Gauge | angka tengah 26px di HP, 40px di desktop. |
| BarChart | label sumbu-x dijarangkan otomatis, dan label terakhir selalu tampil tanpa bertumpuk. |

Pola kartu statistik (StatTile/kit): kotak ikon + angka besar `tabular-nums` + pill delta mint + keterangan kecil. Di HP bisa 2 kolom `compact` (ikon disembunyikan), dengan angka total selebar penuh.

## 5. Layout per area

- **Website publik (`/`)**:
  - Navbar sticky transparan → putih, tinggi 64px. Di HP:
    - Logo: tanda 32px, nama 15px.
    - Tombol CTA 32px teks 12px (`max-sm:!h-8 max-sm:!px-3 max-sm:!text-xs`, area sentuh 44px).
    - Hamburger 36px (area sentuh 44px).
    - Item menu 44px teks 13px.
  - Hero di HP:
    - Section `pt-20 pb-12` tanpa `min-h` layar penuh.
    - Tab TRYOUT/LATIHAN 32px teks 11px.
    - Bar langkah video 36px teks 11px.
    - Tombol utama 40px teks 13px.
  - Urutan section: Hero (toggle mode + judul + checklist + CTA | video/mockup + maskot + emblem) → Fitur → Testimoni (marquee) → SKD (explorer donat) → Langkah (bento) → Panduan → FAQ (accordion) → Kontak (form) → CTA gelap → Footer (2 kolom tautan di HP, tiap tautan 40px teks 13px).
  - Indikator titik section hanya `xl:`. Latar section crossfade.
- **Auth** (login/daftar/lupa/reset): layar terbagi. Kiri panel media besar, kanan form max-w 380px. Di HP hanya form, tombol 40px (Button md), input 16px/44px, dan safe-area atas/bawah. Judul masih 28px di HP — belum ikut skala ringkas (kandidat 24px).
- **Panel peserta**:
  - Topbar: logo + nav pill, cari ⌘K, lonceng, profil. Di HP:
    - Ikon bulat 36px (area sentuh 44px).
    - Hamburger berisi nav + Profil/Testimoni/Putar tutorial (item 44px teks 13px).
  - Header halaman bertema biru-putih bermaskot.
  - Dashboard: kalender minggu. Di HP berupa strip 7 hari (52px) + agenda hari terpilih; ≥640 berupa grid.
  - Header halaman: judul 20px di HP. Tombol aksi 40px teks 13px, dua per baris.
- **Ruang ujian CBT (`/ujian`)**:
  - Tanpa sidebar. Soal di kiri, panel nomor di kanan, timer monospace di header.
  - Di HP: bar bawah fixed `[←] [Ragu] [Lanjut →]` + safe-area, daftar soal di bottom-sheet 6 kolom × 44px.
  - Status nomor: belum (mist), dijawab (cobalt), ragu (kuning), aktif (outline obsidian).
- **Panel super admin**:
  - Sidebar putih rounded terpisah. Di HP berupa drawer dengan item 40px + safe-area.
  - Topbar memuat breadcrumb + ikon 40px (IconButton md, area sentuh 48px) + menu profil kanan (36px di HP).
  - `AdminPageHeader`: judul 20px (HP); tombol aksi wrap 2 per baris dan tombol utama full-width di HP.
- **Elemen melayang**:
  - Tombol GroupChat (56px desktop, 48px HP) memakai safe-area dan otomatis bersembunyi saat scroll ke bawah di HP.
  - Konten/footer diberi ruang bawah ±88px + safe-area agar tidak tertutup.
  - Tombol ke-atas 44px.

## 6. Aturan mobile (wajib untuk perubahan baru)

0. **Skala HP ringkas (preferensi pengguna).** Ikuti tabel §2. Jangan memperbesar elemen khusus HP. Ukuran HP tombol
   dan tab sudah diatur di komponen (`Button`, `SegmentedControl`, `Segmented`, `Tabs`, `kit.jsx`), jadi halaman
   tinggal memakai komponennya.
1. **Mobile-first tanpa merusak desktop.** `cn()` (`lib/cn.js`) **tidak** memakai tailwind-merge, jadi menimpa kelas lewat `className` tidak andal. Gunakan:
   - pola **base = nilai HP + `sm:` = nilai desktop**, atau
   - varian **`max-sm:`** (berlaku < 640px, selalu menang atas kelas base).
   Ingat ikut mengunci `sm:leading-*`/`sm:tracking-*` bila mengubah line-height/tracking base, agar desktop tidak bergeser.
   Menimpa ukuran bawaan komponen di HP harus pakai `!` (mis. `max-sm:!h-8 max-sm:!text-xs`), karena dua kelas
   `max-sm:` untuk properti yang sama bentrok.
2. **Target sentuh ≥ 44×44px**, jarak antar target ≥ 8px. Kalau ukuran visual harus kecil, perluas area sentuh dengan pseudo-element `before:`/`after:` (lihat IconButton/Switch, tombol navbar, tab hero). Tailwind otomatis memberi `content: ''`.
3. **Input 16px di HP** (`max-sm:text-[16px]`, bukan `text-base`). Lebih kecil dari itu memicu auto-zoom di iOS.
4. **Tanpa scroll horizontal di 360 & 390px.** Tabel, grafik, dan tab boleh digulir di dalam kontainernya sendiri, asal terlihat bisa digeser.
5. **Safe-area iPhone:** `viewport.viewportFit = 'cover'` sudah aktif (`app/layout.jsx`). Elemen fixed di tepi layar pakai `env(safe-area-inset-*)`, mis. `pb-[max(12px,env(safe-area-inset-bottom))]`.
6. **Gerak lebih ringan di HP:** parallax/rotasi scroll dimatikan (`.hero-parallax`), reveal tanpa blur, hover-lift mati, dan `prefers-reduced-motion` selalu dihormati.
7. **Hero tidak dipaksa setinggi layar** di HP. Pastikan konten penting dan CTA terlihat di layar pertama.
8. **Tombol aksi di header halaman** di HP rata lebar/terbungkus rapi, tidak berdesakan dalam satu baris.
9. **Token font HP.** `text-sm`…`text-4xl` otomatis mengecil di HP (§2). Ukuran px langsung (`text-[15px]`) tidak,
   jadi tulis nilai HP sendiri (base) + desktop (`sm:`). Teks bacaan panjang (soal, pembahasan, artikel) minimal 14px.

## 7. Checklist sebelum selesai

- [ ] Cek di **360×740**, **390×844**, dan **1366×900**: `document.documentElement.scrollWidth <= innerWidth`.
- [ ] Tampilan ≥ 640px tidak berubah (kecuali memang disengaja).
- [ ] Skala HP sesuai tabel §2: judul 20–24px, teks 13–14px, tombol 40px/13px, tab 32px/12px.
- [ ] Target sentuh ≥ 44px (boleh lewat pseudo-element), teks fungsional ≥ 11px, input 16px di HP.
- [ ] Audit otomatis di 390px dengan `~/.claude/skills/design-system/scripts/mobile_audit.js`:
      `mobileAudit(['/', '/dashboard', '/admin', …], { key: 'A' })` lalu `mobileAuditReport('A')`.
      Tidak ada temuan di luar skala, dan tidak ada scroll horizontal. Jangan mengedit file selama audit berjalan
      (HMR me-reload tab).
- [ ] Semua state ada: default, hover, focus (ring cobalt), disabled, loading, error, empty.
- [ ] Elemen melayang tidak menutupi konten atau tombol, dan safe-area dipakai.
- [ ] Teks UI berbahasa Indonesia, nada ramah dan ringkas.
- [ ] `npx next lint --dir app --dir components --dir lib` bersih.
