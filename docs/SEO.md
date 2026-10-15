# SEO & Pencarian AI — kontrak (MENGIKAT)

Tujuan: website mudah ditemukan untuk kueri seperti **belajar cpns, jadi pns, tryout cpns gratis, simulasi CAT BKN,
materi/soal SKD (TWK/TIU/TKP), passing grade SKD, CPNS 2027** di Google/Bing dan dikutip mesin AI
(ChatGPT Search, Perplexity, Gemini/AI Overviews, Claude). Peringkat #1 tidak bisa dijamin oleh kode saja —
lihat "Checklist setelah deploy" di bawah.

## Fondasi (sudah ada)
- `lib/seo.js` — `siteUrl(site)` (env `SITE_URL` > `site.seo.site_url` > `https://belajarcpns.web.id`), `siteHost`,
  `absoluteUrl(site, path)`, `seoTitle`, `seoDescription`, `alternateNames`, `PRIVATE_PATHS`.
- `lib/site-server.js` (server-only) — `getSiteRaw()`, `getSite()` (sudah di-merge default), `getTestimonials()`.
- `components/seo/JsonLd.jsx` — `<JsonLd data={obj|array} />`.
- `lib/site-defaults.js` → `seo: { site_url, title, description, keywords[], alternate_names[], og_image, google_verification, bing_verification, same_as[] }`.
- `lib/panduan/index.js` — `ARTICLES` (metadata artikel), `getArticleMeta(slug)`, `loadArticle(slug)` (isi di `lib/panduan/articles/<slug>.js`).

## Aturan konten (WAJIB)
- Bahasa Indonesia baku-santai, akurat. **Jangan mengarang** fakta, jadwal, kuota, atau klaim. Jadwal CPNS 2027 belum
  diumumkan per 15 Oktober 2026 — tulis begitu, sarankan cek kanal resmi. Acuan format SKD terakhir (seleksi CPNS 2024,
  KepmenPANRB No. 321 Tahun 2024): 110 soal / 100 menit; TWK 30 soal (benar 5, salah/kosong 0, maks 150, PG 65);
  TIU 35 soal (benar 5, maks 175, PG 80); TKP 45 soal (nilai 1–5 per opsi, maks 225, PG 166); total maks 550.
  Lulus SKD = setiap subtes ≥ PG; peringkat dari total. Sebut bahwa nilai bisa berubah untuk 2027.
  Jalur khusus (KepmenPANRB 321/2024): lulusan cumlaude & diaspora → total ≥ 311 dan TIU ≥ 85; penyandang disabilitas
  & putra/putri Papua → total ≥ 286 dan TIU ≥ 60. Peserta yang lolos PG lalu diperingkat; yang lanjut SKB maksimal
  3× jumlah kebutuhan formasi. Jadwal & formasi CPNS 2026/2027 **belum diumumkan resmi** (per Oktober 2026);
  BKN memperingatkan poster/tautan pendaftaran palsu — hanya percaya sscasn.bkn.go.id, bkn.go.id, menpan.go.id.
- Fitur platform yang BOLEH disebut (ada di website): gratis, tanpa iklan, tryout CBT 110 soal 100 menit mirip CAT BKN,
  timer dihitung server, simpan otomatis/lanjut setelah koneksi putus, tanda ragu-ragu & panel nomor, latihan per
  sub-materi TWK/TIU/TKP dengan pembahasan langsung, skor per subtes, status lulus vs passing grade, peringkat,
  analisis/grafik progres, riwayat, target harian, live group chat, testimoni, kirim pesan ke admin/developer.
- **Bukan situs resmi BKN** — tulis jelas; tautkan sumber resmi: https://sscasn.bkn.go.id , https://www.bkn.go.id ,
  https://www.menpan.go.id .
- Jangan pakai AggregateRating/Review schema dari testimoni (aturan self-serving review Google).
- Struktur ramah AI: kalimat pembuka langsung menjawab pertanyaan (2–3 kalimat), heading jelas, daftar & tabel,
  FAQ singkat, tanggal "Diperbarui", sumber resmi.

## Skema isi artikel (`lib/panduan/articles/<slug>.js`, `export default {...}`)
```js
{
  intro: 'Jawaban langsung 2–3 kalimat (boleh **tebal** dan [tautan](/panduan/slug)).',
  sections: [
    { id: 'apa-itu-skd', title: 'Apa itu SKD?', blocks: [
      { type: 'p', text: '...' },
      { type: 'h3', text: '...' },
      { type: 'ul', items: ['...', '...'] },           // 'ol' sama
      { type: 'table', head: ['Subtes', 'Soal'], rows: [['TWK', '30']] },
      { type: 'callout', tone: 'info' | 'tip' | 'warning', title: '...', text: '...' },
      { type: 'question', label: 'TIU', text: 'Soal...', options: ['A ...','B ...'], answer: 'B', explanation: '...' },
    ] },
  ],
  faq: [ { q: '...', a: '...' } ],                    // 3–6 butir → FAQPage JSON-LD
  sources: [ { label: 'SSCASN BKN', url: 'https://sscasn.bkn.go.id' } ],
}
```
Teks inline: `**tebal**` dan `[label](url)`. URL internal diawali `/`.

## Halaman & rute publik yang diindeks
`/`, `/daftar`, `/panduan`, `/panduan/<slug>`, `/tentang`. Lainnya (panel, ujian, API, design-system, login,
lupa/reset sandi) **noindex** (robots.txt + header `X-Robots-Tag`). `/login` boleh dirayapi tapi `noindex`.

## Teknis yang dipasang
| Berkas (apps/web kecuali disebut) | Isi |
|---|---|
| `app/layout.jsx` | Metadata global: `metadataBase` (= `siteUrl`), title `{ default: seoTitle, template: '%s · Brand' }`, description, keywords, `applicationName`, Open Graph (`website`, `id_ID`, siteName), Twitter `summary_large_image`, robots (`max-image-preview:large`, `max-snippet:-1`, `max-video-preview:-1`), verifikasi Google + Bing (`msvalidate.01`; kode saja atau tag `<meta>` utuh diterima), `category: education`, `formatDetection.telephone: false`, ikon dari logo. Site dibaca lewat `lib/site-server.js`. Env `SITE_URL` diteruskan ke klien (`initialSite.seo.site_url`) agar `siteHost` sama saat SSR & hidrasi. |
| `lib/seo-metadata.js` | `verificationCode(v)`, `ogImages(site, alt, fallback)` (og_image CMS → gambar itu; kosong → `fallback`). |
| `app/(public)/page.jsx` | Beranda: `alternates.canonical: '/'`, `openGraph.url: '/'` + title/description/images; JSON-LD `@graph` (Organization, WebSite, WebApplication `EducationalApplication` gratis `price 0 IDR` + `featureList`, FAQPage dari `site.faq.items` bila section FAQ tampil). Testimoni diambil di server (`getTestimonials`) → `TestimonialsProvider` → teks testimoni ada di HTML SSR. |
| `components/landing/TestimonialsContext.jsx` | Provider data awal testimoni; `TestimonialMarquee` memakai data ini lalu tetap refetch di klien. |
| `app/robots.js` | `Allow: /` & `/uploads/`, `Disallow: PRIVATE_PATHS`; grup eksplisit untuk Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User, Google-Extended, Applebot(-Extended), DuckDuckBot, YandexBot, CCBot; `Sitemap` + `Host` absolut. |
| `app/sitemap.js` | `/` (1.0, daily, lastmod = `updated_at` CMS / panduan terbaru), `/panduan` (0.9, weekly), tiap `ARTICLES` (0.8, lastmod = `dateModified`), `/tentang` (0.5), `/daftar` (0.6). |
| `app/manifest.js` | `/manifest.webmanifest`: nama brand + tagline, `short_name` brand, `start_url /`, standalone, `#F2F3F6`/`#3765F6`, `lang id`, ikon = logo brand atau `/maskot/profil.webp`. |
| `app/opengraph-image.jsx`, `app/twitter-image.jsx` | Gambar 1200×630 otomatis (brand, "Belajar CPNS & Tryout CAT SKD Gratis", chip 110 soal · 100 menit · Pembahasan, domain, maskot). |
| `app/(public)/panduan/[slug]/opengraph-image.jsx` | og:image per artikel (URL dibuat Next, mis. `/panduan/<slug>/opengraph-image-<hash>/og`; alt = judul artikel): chip kategori, judul, menit baca, tanggal, domain. |
| `lib/og-image.jsx` | Render bersama (`next/og`). Font TTF `app/fonts/PlusJakartaSans-{ExtraBold,SemiBold}.ttf` (ikut standalone lewat `outputFileTracingIncludes`), maskot `public/og/maskot.png`, logo PNG/JPG dari `/uploads` (lewat API internal). Cache 1 jam. |
| `app/llms.txt/route.js`, `app/llms-full.txt/route.js`, `lib/llms.js` | [llms.txt](https://llmstxt.org): ringkasan, Tentang (fakta SKD di atas), Fitur, Halaman penting (URL absolut + deskripsi artikel), Sumber resmi. `llms-full.txt` = kepala + isi semua artikel (skema di atas → Markdown); artikel yang belum ada isinya dilewati. `X-Robots-Tag: noindex` (bukan untuk hasil pencarian). |
| `next.config.mjs` | Header `X-Robots-Tag: noindex, nofollow` untuk `/admin`, `/dashboard`, `/latihan`, `/tryout`, `/ujian`, `/hasil`, `/riwayat`, `/profil`, `/testimoni`, `/design-system`, `/lupa-password`, `/reset-password`, `/login` (+ subpath). |
| Metadata `robots` | `(admin)`, `(peserta)`, `(focus)` layout: `noindex, nofollow`. `/login`, `/lupa-password` (via `layout.jsx`), `/reset-password`, `/design-system`: `noindex, follow`. `/daftar`: diindeks — title, description, canonical `/daftar`. |
| `components/admin/site/*` | Atur Website → grup **SEO** (`site.seo`): URL website, judul (≤ 60) & deskripsi (≤ 160) dengan penghitung, pratinjau hasil Google, kata kunci, nama alternatif, gambar OG (1200×630), verifikasi Google/Bing, profil `sameAs` (divalidasi URL http(s)); pratinjau kartu bagikan di panel kanan. |
| `StepsBento.jsx`, `AuthVisual.jsx` | Domain di bilah alamat mockup = `siteHost(site)` (bukan lagi turunan nama brand). |

### Aturan metadata untuk halaman baru (penting)
- **Canonical tidak dipasang di layout root** (akan diwarisi semua halaman). Setiap halaman publik yang diindeks
  wajib mengisi `alternates: { canonical: '/path' }` sendiri.
- og:title/og:description otomatis mengikuti `title`/`description` halaman bila halaman **tidak** mengisi `openGraph`.
- Bila halaman mengisi `openGraph`, objek itu **mengganti** milik layout (termasuk gambar). Maka sertakan
  `type`, `locale: 'id_ID'`, `siteName`, `url`, dan `images`. Pengecualian: segmen yang punya file `opengraph-image`
  sendiri — artikel panduan **tidak boleh** mengisi key `openGraph.images` (agar `[slug]/opengraph-image.jsx` dipakai).
  `/panduan` & `/tentang`: `images: ogImages(site, title, '/opengraph-image')` dari `lib/seo-metadata.js`.

### IndexNow (Bing, Yandex, Seznam, Naver; dipakai juga ChatGPT Search/Copilot via indeks Bing)
- Kunci: `apps/web/public/f3cee5ae0f67c724dca01f7ad4c33893.txt` (isi = nama file) → disajikan di
  `https://belajarcpns.web.id/f3cee5ae0f67c724dca01f7ad4c33893.txt`. Jangan dihapus/diganti tanpa alasan.
- Kirim semua URL sitemap (setelah deploy, dan setiap menerbitkan/memperbarui panduan):
  ```bash
  python scripts/indexnow.py                         # default --base https://belajarcpns.web.id
  python scripts/indexnow.py --base https://domain-lain.id
  python scripts/indexnow.py --dry-run --sitemap http://localhost:3000/sitemap.xml   # cek payload tanpa mengirim
  ```
  Skrip membaca `<base>/sitemap.xml`, menyaring URL ber-host sama, lalu POST `{host, key, keyLocation, urlList}` ke
  `https://api.indexnow.org/indexnow` (HTTP 200/202 = diterima). Hanya pustaka standar Python.

## Checklist setelah deploy (di luar kode)
1. Deploy di domain asli + HTTPS, set `SITE_URL=https://belajarcpns.web.id` (atau isi di Atur Website → SEO).
2. Google Search Console: verifikasi (isi kode di Atur Website → SEO), kirim `/sitemap.xml`, minta indeks beranda & panduan.
3. Bing Webmaster Tools (dipakai ChatGPT Search & Copilot): verifikasi, kirim sitemap, jalankan `python scripts/indexnow.py`.
4. Profil sosial (Instagram/TikTok/YouTube) dengan nama brand yang sama + tautan ke website → isi `seo.same_as`.
5. Backlink berkualitas: forum/komunitas CPNS, Kompasiana/Medium, video tutorial, kerja sama kampus/bimbel.
6. Terbitkan/perbarui panduan rutin (setiap ada pengumuman resmi CPNS 2027) dan ubah `dateModified`.
7. Pantau Search Console (kueri, CTR, Core Web Vitals) tiap minggu.
