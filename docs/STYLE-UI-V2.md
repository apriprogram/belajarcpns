# BISA-PNS — Style UI v2 ("Calm Workspace")

Ringkasan analisa referensi (Magnific app & login, dashboard medis Dribbble, Zentalk inbox, 123done form/ikon,
modal reschedule/kalender, modal "Create project") → diterapkan ke palet BISA-PNS yang sudah ada
(Obsidian #181D25, Cobalt #3765F6, Mint #70FC8E, Mist #C3CED7, Ghost #F2F3F6). **Jangan ganti palet atau font.**

## Prinsip
1. **Datar, hampir tanpa shadow.** Pemisahan memakai latar abu (`bg-ghost`) vs permukaan putih + garis 1px
   `ring-1 ring-inset ring-mist-100` / `border-mist-100`. Shadow HANYA untuk lapisan melayang: modal, dropdown/menu,
   popover kalender, toast → satu shadow lembut: `0 12px 32px -8px rgba(24,29,37,.12), 0 2px 6px rgba(24,29,37,.04)`
   (token Tailwind `shadow-float`).
2. **Shell "kanvas dalam kanvas"** (Magnific): halaman `bg-ghost` dengan padding 8–12px; sidebar & area konten
   adalah panel putih `rounded-[20px]` terpisah, tanpa shadow.
3. **Satu fokus per kartu**, ruang lega, teks ringkas. Judul halaman besar + deskripsi abu satu kalimat.
4. Ikon garis membulat (lucide, strokeWidth 1.75–2, ukuran 18–20px) dalam kotak ikon `h-9 w-9 rounded-xl ring-1 ring-mist-100`.

## Token
| Hal | Nilai |
|---|---|
| Latar halaman | `bg-ghost` (#F2F3F6) |
| Permukaan | `bg-white`, garis `ring-mist-100` (#E7ECF0) |
| Permukaan sekunder (isi kartu, tombol soft, segmented) | `bg-ghost` atau `bg-mist-50` |
| Radius | panel/kartu `rounded-[20px]`; kontrol (input, tombol kotak, item menu) `rounded-xl` (12px); pill `rounded-full`; modal `rounded-[24px]` |
| Tinggi kontrol | sm 36px · md 44px · lg 48px |
| Teks | judul halaman `text-[28px] font-semibold tracking-[-0.02em]`; judul kartu `text-[15px] font-semibold`; deskripsi `text-sm text-mist-700`; label field `text-sm font-medium`; angka statistik `text-[32px] font-semibold tabular-nums` |
| Fokus | `ring-2 ring-cobalt` (border cobalt 1.5–2px seperti 123done) |

## Komponen
- **Button**: `primary` obsidian solid; `accent` cobalt solid; `secondary` putih + `ring-1 ring-mist-100` (seperti "See Details"/"Change"); `soft` latar ghost tanpa garis (seperti "Lanjutkan dengan Apple", "Clear"); `ghost`; `danger`. Tanpa shadow. Bentuk default `rounded-xl`; pill (`rounded-full`) dipakai di landing & nav.
- **Input / Select / Textarea**: putih, `ring-1 ring-mist-100`, `rounded-xl`, h-11, ikon kiri opsional; focus `ring-2 ring-cobalt`; error ring danger + pesan; varian "field berlabel di dalam" (label kecil di atas nilai, ikon kiri) seperti Date/Time pada modal reschedule.
- **Dropdown / Menu**: tombol pemicu seperti Select; panel melayang putih `rounded-2xl p-1.5 shadow-float ring-1 ring-mist-100`; item `h-9 rounded-lg px-3 hover:bg-ghost`, item aktif `bg-ghost font-medium`, grup berlabel kecil uppercase.
- **Switch**: track 36×20, off `bg-mist`, on `bg-cobalt`, knob putih.
- **Kalender / DatePicker**: header bulan + tombol bulat prev/next (`h-8 w-8 rounded-full ring-1 ring-mist-100`), nama hari kecil abu, tanggal `h-9 w-9 rounded-xl`, terpilih `bg-cobalt text-white`, hari ini teks cobalt bold, footer tombol `soft` "Hapus".
- **Upload file**: dropzone `border-2 border-dashed border-mist rounded-2xl bg-mist-50`, ikon awan, "Pilih file atau seret ke sini", keterangan format, tombol `secondary sm` "Pilih file"; daftar file terunggah sebagai baris berbingkai.
- **Modal**: `rounded-[24px]`, header (ikon opsional + judul + tombol tutup bulat `bg-ghost`), garis pemisah, body p-6, footer kanan. Satu-satunya elemen ber-shadow (`shadow-float`) + backdrop `bg-obsidian/30 backdrop-blur-[2px]`.
- **Card**: putih `rounded-[20px] ring-1 ring-mist-100 p-5/6`, header: judul + ikon info kecil + aksi `secondary sm` ("Detail") di kanan. **StatCard** (dashboard medis): kotak ikon + angka besar + pill delta mint (`bg-mint-50 text-mint-700 text-xs`) + keterangan kecil + mini chart/bar.
- **Tabel**: dibungkus kartu; header `bg-ghost text-[11px] uppercase tracking-wider text-mist-700 font-semibold`; baris h-14 `border-b border-mist-100`, hover `bg-mist-50`; status = pill outline tipis berwarna; aksi titik tiga.
- **Filter bar**: search (ikon kiri, pill/rounded-xl, opsional kbd ⌘K), tombol `secondary` "Filter" dengan ikon, segmented control (All/Private/Shared): kontainer `bg-ghost p-1 rounded-xl`, item aktif putih `ring-1 ring-mist-100`.
- **Tabs besar** (Magnific "Discover | Use Cases"): judul besar, tab nonaktif `text-mist`, aktif obsidian.
- **Pagination**: "Menampilkan 1–8 dari 235" kiri; tombol angka kotak `h-8 min-w-8 rounded-lg ring-1 ring-mist-100`, aktif `bg-cobalt text-white`; « ‹ › » ; "Ke halaman [ ] Go" kanan.
- **PageHeader (Judul + Deskripsi)**: breadcrumb kecil abu di atas (opsional), judul `text-[28px]`, deskripsi satu kalimat `text-mist-700`, aksi di kanan (tombol `secondary` + satu `primary/accent`).
- **Empty state**: ikon dalam kotak `bg-ghost rounded-xl`, judul, deskripsi, tombol primary + link.

## Layout per area
- **Login / Daftar / Lupa / Reset** (Magnific login): layar terbagi. Kiri: panel media besar `rounded-[24px]` (video/gambar penuh, gradien gelap bawah, judul + subjudul putih, indikator tab bergaris di bawah yang bergulir otomatis). Kanan: form di tengah, max-w 380px: logo, judul besar, tombol sosial/soft, pemisah "atau dengan email", input, tombol penuh.
- **Panel Admin** (Magnific app): sidebar kiri putih rounded terpisah (logo + tombol ciutkan, tombol "Buat" aksen, grup navigasi berikon, item aktif `bg-ghost`, area bawah: ikon pengaturan/notifikasi/profil); topbar tipis dalam panel konten (breadcrumb kiri, aksi kanan); konten di panel putih besar. Dashboard memakai grid kartu statistik ala dashboard medis.
- **Dashboard Peserta** (dashboard medis): topbar berisi logo + nav pill (aktif obsidian, lainnya putih ber-ring), search ⌘K, lonceng, profil; header halaman (judul + deskripsi + aksi); grid StatCard + chart + tabel.
