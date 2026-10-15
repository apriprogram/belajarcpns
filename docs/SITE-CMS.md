# Atur Website (CMS) — kontrak data (MENGIKAT)

Admin mengatur branding & seluruh konten halaman utama. Data disimpan sebagai satu dokumen JSON
`settings.key = 'site'`. Nilai default = konten frontend saat ini (file `apps/web/lib/site-defaults.js`).
Frontend selalu **deep-merge** `defaults ← data server` (objek digabung per key; **array diganti utuh** bila ada di server).

## API (backend)
| Metode | Path | Akses | Keterangan |
|---|---|---|---|
| GET | `/api/site` | publik | `{ "site": <objek tersimpan atau {}>, "updated_at": RFC3339|null }` |
| PUT | `/api/admin/site` | admin | body = objek site LENGKAP (menimpa). Maks 256 KB, harus JSON object. → `{ site, updated_at }`. Catat `logActivity("situs.ubah", ...)` |
| POST | `/api/admin/site/upload` | admin | multipart `file`. Gambar (png/jpg/webp/gif/svg→DITOLAK, ico boleh) maks 5 MB, video (mp4/webm) maks 50 MB → `{ url: "/uploads/site/<uuid>.<ext>", kind: "image"|"video", name, size }` |
| DELETE | `/api/admin/site` | admin | reset ke default (hapus row) → `{ site: {} }` |

## Skema `site` (semua field opsional; nama key PERSIS)
```js
{
  brand: {
    name: 'BISA-PNS',            // nama website; tampil di logo, title tab, footer, auth, panel peserta & admin
    accent_char: '-',            // karakter di nama yang diwarnai (cobalt); '' = tidak ada
    logo_url: null,              // gambar logo (kotak). null = logo bawaan (kotak obsidian huruf pertama + titik mint)
    logo_letter: 'B',            // huruf di logo bawaan
    tagline: 'Tryout CBT CPNS 2027', // dipakai di <title> beranda: `${name} — ${tagline}`
    description: 'Latihan soal & tryout CBT SKD CPNS 2027 (TWK, TIU, TKP) dengan timer server, pembahasan, dan analisis skor.', // meta description
  },
  navbar: {
    links: [{ id: 'fitur', label: 'Fitur' }, { id: 'testimoni', label: 'Testimoni' }, { id: 'skd', label: 'SKD' }, { id: 'langkah', label: 'Cara mulai' }, { id: 'panduan', label: 'Panduan' }, { id: 'faq', label: 'FAQ' }, { id: 'kontak', label: 'Kontak' }],
    login_label: 'Masuk',
    cta_label: 'Daftar',
  },
  sections: {   // visible:false → section disembunyikan (juga dari navbar & indikator titik)
    hero:    { visible: true },
    fitur:   { visible: true, index: '01', label: 'Platform', title: 'Fitur', description: '' },
    testimoni: { visible: true, index: '02', label: 'Kata peserta', title: 'Testimoni', description: 'Cerita mereka yang sudah berlatih di sini.' }, // isi kartu dari GET /api/testimonials (docs/TESTIMONI.md)
    skd:     { visible: true, index: '03', label: 'Struktur SKD', title: 'Tiga subtes, satu target', description: 'Format terbaru. Bisa diperbarui admin.' },
    langkah: { visible: true, index: '04', label: 'Cara mulai', title: 'Tiga langkah', description: 'Daftar, latihan, lalu tryout.' },
    panduan: { visible: true, index: '05', label: 'Belajar', title: 'Panduan CPNS', description: 'Materi, tips, dan info seleksi yang ringkas dan akurat.' }, // kartu artikel dari lib/panduan (docs/SEO.md)
    faq:     { visible: true, index: '06', label: 'Bantuan', title: 'Pertanyaan umum', description: 'Masih bingung? Hubungi admin lewat dashboard.' },
    kontak:  { visible: true, index: '07', label: 'Kontak', title: 'Kirim pesan', description: 'Ada pertanyaan atau saran? Tulis untuk admin atau developer.' },
    cta:     { visible: true },
  },
  hero: {
    modes: [   // tab di hero (maks 3); href tombol
      { key: 'tryout', tab: 'Tryout', lead: 'Lolos SKD dengan', accent: 'tryout CBT', points: ['110 soal, 100 menit, seperti CAT BKN', 'Timer server & simpan otomatis', 'Skor, peringkat, dan pembahasan'], cta: 'Mulai Tryout', href: '/daftar?next=/tryout' },
      { key: 'latihan', tab: 'Latihan', lead: 'Belajar SKD lewat', accent: 'latihan terarah', points: ['Soal TWK, TIU, TKP per materi', 'Pembahasan langsung tiap soal', 'Pantau progres harian'], cta: 'Mulai Latihan', href: '/daftar?next=/latihan' },
    ],
    video_url: '/video/tutorial.webm',
    poster_url: '/video/tutorial-poster.jpg',
    steps: [ { start: 0, label: 'Daftar akun', hint: 'Email & nomor HP' }, { start: 14, label: 'Pilih tryout', hint: 'Dari dashboard' }, { start: 25, label: 'Simulasi ujian', hint: 'Seperti CAT BKN' } ],
    mascot: { visible: true, image_url: '/landing/maskot.webp', bubble: 'Halo, calon ASN! 👋' },
  },
  features: {
    hero: { tag: 'Tryout', image: '/landing/fitur-tryout.jpg', title: 'Tryout CBT seperti CAT BKN', description: '110 soal dalam 100 menit. Timer dihitung server, jawaban tersimpan otomatis, dan skor keluar begitu selesai.', meta: '110 soal · 100 menit' },
    items: [
      { tag: 'Materi', image: '/landing/fitur-bank-soal.jpg', title: 'Bank soal TWK, TIU, TKP', description: 'Latihan per sub-materi, dari mudah hingga sulit.' },
      { tag: 'Progres', image: '/landing/fitur-analisis.jpg', title: 'Analisis skor & peringkat', description: 'Tahu bagian yang lemah dan posisi Anda.' },
      { tag: 'Belajar', image: '/landing/fitur-pembahasan.jpg', title: 'Pembahasan tiap soal', description: 'Kunci, bobot TKP, dan penjelasan singkat.' },
      { tag: 'Komunitas', image: '/landing/fitur-groupchat.jpg', title: 'Live Group Chat', description: 'Forum diskusi, info terbaru, dan berbagi tips bersama peserta lain secara langsung.' },
    ],
  },
  skd: {   // tampilan kartu SKD (angka penilaian resmi tetap dari data ini)
    subtests: [
      { code: 'TWK', name: 'Wawasan Kebangsaan', count: 30, max: 150, pass: 65, scoring: 'Benar 5 · salah 0', topics: ['Nasionalisme','Integritas','Bela negara','Pilar negara','Bahasa Indonesia'] },
      { code: 'TIU', name: 'Intelegensia Umum', count: 35, max: 175, pass: 80, scoring: 'Benar 5 · salah 0', topics: ['Verbal','Numerik','Figural','Logika'] },
      { code: 'TKP', name: 'Karakteristik Pribadi', count: 45, max: 225, pass: 166, scoring: 'Nilai 1–5 per opsi', topics: ['Pelayanan publik','Jejaring kerja','Sosial budaya','Profesionalisme','TIK','Anti radikalisme'] },
    ],
    duration_minutes: 100,
    note: 'Lulus bila semua subtes mencapai passing grade.',
  },
  steps: {   // section "Tiga langkah" (StepsBento)
    daftar:  { title: 'Daftar', text: 'Cukup email dan nomor HP. Gratis.', image: '/landing/daftar.jpg' },
    latihan: { title: 'Latihan', text: 'Soal TWK, TIU, TKP dengan pembahasan.' },
    tryout:  { title: 'Tryout CBT', text: '110 soal · 100 menit, seperti CAT BKN.', cta: 'Coba tryout', href: '/daftar' },
    hasil:   { eyebrow: 'LALU', title: 'Skor & pembahasan', text: 'Skor per subtes, peringkat, dan penjelasan tiap soal.', images: ['/landing/latihan.jpg', '/landing/hasil.jpg'], badge: 'Lulus · 435' },
  },
  faq: { items: [ { q: 'Apakah gratis?', a: 'Ya. Daftar, latihan, dan tryout tanpa biaya.' }, /* ...6 item saat ini */ ] },
  kontak: { aside: [ { title: 'Admin', text: 'Pertanyaan akun, jadwal tryout, dan soal.' }, { title: 'Developer', text: 'Laporkan bug atau usulkan fitur baru.' } ] },
  cta: { title: 'Mulai latihan', accent: 'hari ini', subtitle: 'Gratis. Tanpa iklan.', primary_label: 'Daftar', primary_href: '/daftar', secondary_label: 'Masuk', secondary_href: '/login' },
  footer: {
    description: 'Latihan & tryout CBT untuk SKD CPNS 2027.',
    columns: [
      { title: 'Produk', links: [{ label: 'Fitur', href: '/#fitur' }, { label: 'Testimoni', href: '/#testimoni' }, { label: 'SKD', href: '/#skd' }, { label: 'Cara mulai', href: '/#langkah' }] },
      { title: 'Akun', links: [{ label: 'Daftar', href: '/daftar' }, { label: 'Masuk', href: '/login' }, { label: 'Lupa sandi', href: '/lupa-password' }] },
      { title: 'Bantuan', links: [{ label: 'FAQ', href: '/#faq' }, { label: 'Kirim pesan', href: '/#kontak' }, { label: 'Panduan', href: '/panduan' }, { label: 'Tentang', href: '/tentang' }] },
    ],
    copyright: 'Bukan situs resmi BKN.',   // tampil: `© {tahun} {brand.name}. {copyright}`
    tagline: 'Order. Balance. Clarity.',
  },
  auth: {   // panel media halaman login/daftar
    slides: [ /* ambil dari components/auth/AuthVisual.jsx: { label, title, subtitle, image | video } */ ],
  },
}
```

## Frontend
- `lib/site-defaults.js` → `export const SITE_DEFAULTS = {...}` (persis konten saat ini) + `mergeSite(defaults, server)` (deep-merge; array diganti).
- `components/providers/SiteProvider.jsx` (client) → `SiteProvider({ initial, children })`, `useSite()` → objek site hasil merge, `setSite()` (dipakai editor untuk pratinjau langsung), `refreshSite()`.
- Root `app/layout.jsx` mengambil `GET ${API_URL}/api/site` di server (`cache: 'no-store'`, timeout ±2 dtk, gagal → defaults), meneruskan ke provider, dan `generateMetadata` memakai `brand.name`/`tagline`/`description`.
- Komponen yang memakai site: `Logo`/`LogoMark` (semua logo: landing, auth, panel peserta, panel admin, footer, GroupChat), `PublicNavbar`, `PublicFooter`, `SectionChrome`, `app/(public)/page.jsx` (heading, fitur, cta), `HeroIntro`, `HeroVideo`, `HeroMascot`, `SkdExplorer`, `TestimonialMarquee` (section testimoni; teks heading dari `sections.testimoni`), `StepsBento`, `FaqAccordion` (via props), `ContactSection` (aside), `AuthVisual`.
- Halaman admin `app/(admin)/admin/situs/` "Atur Website" (menu sidebar grup "Sistem", ikon `Globe`).

## Tambahan skema (implementasi frontend)
- `hero.video_caption` (string, default `'Daftar → pilih tryout → simulasi ujian'`): subjudul di lightbox video hero (judulnya `Tutorial {brand.name}`). Kosong = tidak tampil.
- Penanda tebal `**teks**` didukung di `steps.daftar.text`, `steps.latihan.text`, `steps.tryout.text`, `steps.hasil.text`, dan `skd.note` (default memakai penanda ini agar tampilan sama seperti sebelumnya). Tanpa HTML mentah.
- `auth.slides[]` item: `{ key?, label, title, subtitle, image }` atau `{ key?, label, title, subtitle, video, poster?, start? (detik), duration? (ms, default 5000) }`.
- `hero.modes` maks 3 (lebih dari itu diabaikan); array kosong → pakai default. `auth.slides` kosong → pakai default.
- Warna kartu SKD mengikuti urutan (1 cobalt, 2 kuning, 3 mint, berulang). Statistik "skor maks" = jumlah `max`, "subtes wajib lulus" = jumlah subtes, "menit" = `skd.duration_minutes`.
- Ikon `kontak.aside` mengikuti urutan (1 Headset/admin, 2 Code/developer).
- Label indikator titik (SectionChrome) diambil dari `navbar.links[].label` dengan id yang sama.
- `mergeSite`: nilai server `null`/`undefined` → default; tipe salah (mis. array di tempat objek) diabaikan.
- Helper tambahan di `lib/site-defaults.js`: `sectionVisible(site, id)` (`'beranda'` → `sections.hero`).
- Grid kartu fitur menyesuaikan jumlah `features.items`: 2 → 2 kolom; kelipatan 4 → 2×2 (sm) lalu 4 kolom (xl); kelipatan 3 → 3 kolom (md); lainnya 2/3 kolom.
- Gambar fitur bawaan dibuat prosedural oleh `scripts/generate-feature-art.py` (`python scripts/generate-feature-art.py groupchat` untuk satu gambar).
- Section "Testimoni" (`#testimoni`, di bawah Fitur): heading/visible diatur di grup editor **Section**; datanya dari moderasi admin (`/admin/testimoni`), bukan dari dokumen site. Kosong/endpoint gagal → ajakan "Jadilah yang pertama berbagi cerita".
- **Data tersimpan lama**: karena array dari server mengganti default utuh, `navbar.links`, `features.items`, dan `footer.columns` yang sudah tersimpan tidak otomatis mendapat item baru. Editor menampilkan kotak "Belum ada di daftar (bawaan terbaru)" di grup Navbar dan Fitur untuk menambahkannya dengan satu klik (lalu Simpan). Objek `sections.*` tetap di-merge per key, jadi `sections.testimoni` langsung aktif.
- Section "Panduan" (`#panduan`, setelah Cara mulai): heading/visible/maskot diatur di grup **Section**; kartunya = artikel `lib/panduan` (`components/landing/GuidesSection.jsx`), bukan data site. Isi artikel di `lib/panduan/articles/*` (docs/SEO.md).
- Navbar publik: menu tengah tampil mulai `lg` (≥1024px); di bawahnya memakai menu hamburger.
- `useSiteActions()` (di `SiteProvider.jsx`) → `{ setSite(rawSite), refreshSite() }`; `useSite()` → objek site hasil merge.
