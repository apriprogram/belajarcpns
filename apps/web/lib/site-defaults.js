/**
 * Konten bawaan website (branding + halaman utama + panel auth). Kontrak: docs/SITE-CMS.md.
 * Data dari server (`GET /api/site` → `site`) di-deep-merge di atas objek ini lewat `mergeSite`.
 * Teks yang mendukung `**tebal**`: steps.*.text dan skd.note.
 */
export const SITE_DEFAULTS = {
  brand: {
    name: 'BISA-PNS',
    accent_char: '-',
    logo_url: null,
    logo_letter: 'B',
    tagline: 'Tryout CBT CPNS 2027',
    description: 'Latihan soal & tryout CBT SKD CPNS 2027 (TWK, TIU, TKP) dengan timer server, pembahasan, dan analisis skor.',
  },
  // SEO & pencarian AI (docs/SEO.md). Kosong = dihitung otomatis dari brand.
  seo: {
    site_url: 'https://belajarcpns.web.id',
    title: '',
    description: '',
    keywords: [
      'belajar cpns', 'jadi pns', 'tryout cpns gratis', 'tryout skd', 'latihan soal cpns', 'simulasi cat bkn',
      'soal twk', 'soal tiu', 'soal tkp', 'passing grade skd', 'cpns 2027', 'materi skd cpns',
    ],
    alternate_names: ['BELAJAR CPNS', 'JADI PNS'],
    og_image: '',
    google_verification: '',
    bing_verification: '',
    same_as: [],
  },
  navbar: {
    links: [
      { id: 'fitur', label: 'Fitur' },
      { id: 'testimoni', label: 'Testimoni' },
      { id: 'skd', label: 'SKD' },
      { id: 'langkah', label: 'Cara mulai' },
      { id: 'panduan', label: 'Panduan' },
      { id: 'faq', label: 'FAQ' },
      { id: 'kontak', label: 'Kontak' },
    ],
    login_label: 'Masuk',
    cta_label: 'Daftar',
  },
  sections: {
    hero: { visible: true },
    fitur: { visible: true, index: '01', label: 'Platform', title: 'Fitur', description: '', mascot: { image: '/maskot/section-fitur.webp', say: 'Semua yang kamu butuhkan ada di sini 😉' } },
    testimoni: { visible: true, index: '02', label: 'Kata peserta', title: 'Testimoni', description: 'Cerita mereka yang sudah berlatih di sini.', mascot: { image: '/maskot/section-testimoni.webp', say: 'Terima kasih sudah berbagi cerita! 💗' } },
    skd: { visible: true, index: '03', label: 'Struktur SKD', title: 'Tiga subtes, satu target', description: 'Format terbaru. Bisa diperbarui admin.', mascot: { image: '/maskot/section-skd.webp', say: 'Kenali tiga subtesnya dulu, ya!' } },
    langkah: { visible: true, index: '04', label: 'Cara mulai', title: 'Tiga langkah', description: 'Daftar, latihan, lalu tryout.', mascot: { image: '/maskot/section-langkah.webp', say: 'Yuk, mulai! Cuma tiga langkah kok.' } },
    panduan: { visible: true, index: '05', label: 'Belajar', title: 'Panduan CPNS', description: 'Materi, tips, dan info seleksi yang ringkas dan akurat.', mascot: { image: '/maskot/riwayat.webp', say: 'Baca dulu, biar makin siap!' } },
    faq: { visible: true, index: '06', label: 'Bantuan', title: 'Pertanyaan umum', description: 'Masih bingung? Hubungi admin lewat dashboard.', mascot: { image: '/maskot/section-faq.webp', say: 'Ada yang bikin bingung? Cek di sini.' } },
    kontak: { visible: true, index: '07', label: 'Kontak', title: 'Kirim pesan', description: 'Ada pertanyaan atau saran? Tulis untuk admin atau developer.', mascot: { image: '/maskot/section-kontak.webp', say: 'Tulis pesanmu, admin siap membalas ✍️' } },
    cta: { visible: true, mascot: { image: '/maskot/section-cta.webp', say: 'Semangat! Kursi ASN menunggumu 🎉' } },
  },
  hero: {
    modes: [
      {
        key: 'tryout',
        tab: 'Tryout',
        lead: 'Lolos SKD dengan',
        accent: 'tryout CBT',
        points: ['110 soal, 100 menit, seperti CAT BKN', 'Timer server & simpan otomatis', 'Skor, peringkat, dan pembahasan'],
        cta: 'Mulai Tryout',
        href: '/daftar?next=/tryout',
      },
      {
        key: 'latihan',
        tab: 'Latihan',
        lead: 'Belajar SKD lewat',
        accent: 'latihan terarah',
        points: ['Soal TWK, TIU, TKP per materi', 'Pembahasan langsung tiap soal', 'Pantau progres harian'],
        cta: 'Mulai Latihan',
        href: '/daftar?next=/latihan',
      },
    ],
    video_url: '/video/tutorial-2.webm',
    poster_url: '/video/tutorial-2-poster.jpg',
    video_caption: 'Daftar → pilih tryout → simulasi ujian',
    steps: [
      { start: 0, label: 'Daftar akun' },
      { start: 15, label: 'Pilih tryout' },
      { start: 22, label: 'Simulasi ujian' },
    ],
    mascot: { visible: true, image_url: '/landing/maskot.webp', bubble: 'Halo, calon ASN! 👋' },
    emblem: { visible: true, image_url: '/landing/emblem.webp' },
  },
  features: {
    hero: {
      tag: 'Tryout',
      image: '/landing/fitur-tryout.jpg',
      title: 'Tryout CBT seperti CAT BKN',
      description: '110 soal dalam 100 menit. Timer dihitung server, jawaban tersimpan otomatis, dan skor keluar begitu selesai.',
      meta: '110 soal · 100 menit',
    },
    items: [
      { tag: 'Materi', image: '/landing/fitur-materi.jpg', title: 'Bank soal TWK, TIU, TKP', description: 'Latihan per sub-materi, dari mudah hingga sulit.' },
      { tag: 'Progres', image: '/landing/fitur-progres.jpg', title: 'Analisis skor & peringkat', description: 'Tahu bagian yang lemah dan posisi Anda.' },
      { tag: 'Belajar', image: '/landing/fitur-belajar.jpg', title: 'Pembahasan tiap soal', description: 'Kunci, bobot TKP, dan penjelasan singkat.' },
      { tag: 'Komunitas', image: '/landing/fitur-groupchat.jpg', title: 'Live Group Chat', description: 'Forum diskusi, info terbaru, dan berbagi tips bersama peserta lain secara langsung.' },
    ],
  },
  skd: {
    subtests: [
      { code: 'TWK', name: 'Wawasan Kebangsaan', count: 30, max: 150, pass: 65, scoring: 'Benar 5 · salah 0', topics: ['Nasionalisme', 'Integritas', 'Bela negara', 'Pilar negara', 'Bahasa Indonesia'] },
      { code: 'TIU', name: 'Intelegensia Umum', count: 35, max: 175, pass: 80, scoring: 'Benar 5 · salah 0', topics: ['Verbal', 'Numerik', 'Figural', 'Logika'] },
      { code: 'TKP', name: 'Karakteristik Pribadi', count: 45, max: 225, pass: 166, scoring: 'Nilai 1–5 per opsi', topics: ['Pelayanan publik', 'Jejaring kerja', 'Sosial budaya', 'Profesionalisme', 'TIK', 'Anti radikalisme'] },
    ],
    duration_minutes: 100,
    note: 'Lulus bila **semua subtes** mencapai passing grade.',
  },
  steps: {
    daftar: { title: 'Daftar', text: 'Cukup **email** dan **nomor HP**. Gratis.', image: '/landing/shot-daftar.webp' },
    latihan: { title: 'Latihan', text: 'Soal **TWK, TIU, TKP** dengan pembahasan.' },
    tryout: { title: 'Tryout CBT', text: '110 soal · 100 menit, seperti **CAT BKN**.', cta: 'Coba tryout', href: '/daftar' },
    hasil: {
      eyebrow: 'LALU',
      title: 'Skor & pembahasan',
      text: 'Skor per subtes, **peringkat**, dan penjelasan tiap soal.',
      images: ['/landing/shot-pembahasan.webp', '/landing/shot-hasil.webp'],
      badge: 'Lulus · 435',
    },
  },
  faq: {
    items: [
      { q: 'Apakah gratis?', a: 'Ya. Daftar, latihan, dan tryout tanpa biaya.' },
      { q: 'Mirip CAT BKN?', a: 'Ya. Ada panel nomor, tanda ragu-ragu, timer, dan 110 soal dalam 100 menit.' },
      { q: 'Kalau koneksi putus?', a: 'Jawaban tersimpan otomatis dan timer dihitung server, jadi Anda bisa lanjut.' },
      { q: 'Bagaimana skor dihitung?', a: 'TWK & TIU: benar = 5. TKP: 1–5 per opsi. Lulus bila semua subtes mencapai passing grade.' },
      { q: 'Passing grade bisa berubah?', a: 'Bisa. Admin dapat memperbaruinya kapan saja.' },
      { q: 'Situs resmi BKN?', a: 'Bukan. Ini platform latihan mandiri, bukan situs resmi BKN.' },
    ],
  },
  kontak: {
    aside: [
      { title: 'Admin', text: 'Pertanyaan akun, jadwal tryout, dan soal.' },
      { title: 'Developer', text: 'Laporkan bug atau usulkan fitur baru.' },
    ],
  },
  cta: {
    title: 'Mulai latihan',
    accent: 'hari ini',
    subtitle: 'Gratis. Tanpa iklan.',
    primary_label: 'Daftar',
    primary_href: '/daftar',
    secondary_label: 'Masuk',
    secondary_href: '/login',
  },
  footer: {
    description: 'Latihan & tryout CBT untuk SKD CPNS 2027.',
    columns: [
      { title: 'Produk', links: [{ label: 'Fitur', href: '/#fitur' }, { label: 'Testimoni', href: '/#testimoni' }, { label: 'SKD', href: '/#skd' }, { label: 'Cara mulai', href: '/#langkah' }] },
      { title: 'Akun', links: [{ label: 'Daftar', href: '/daftar' }, { label: 'Masuk', href: '/login' }, { label: 'Lupa sandi', href: '/lupa-password' }] },
      { title: 'Bantuan', links: [{ label: 'FAQ', href: '/#faq' }, { label: 'Kirim pesan', href: '/#kontak' }, { label: 'Panduan', href: '/panduan' }, { label: 'Tentang', href: '/tentang' }] },
    ],
    copyright: 'Bukan situs resmi BKN.',
    tagline: 'Order. Balance. Clarity.',
  },
  auth: {
    // image ATAU video (+ poster, start = detik awal, duration = lama slide ms). key opsional.
    slides: [
      { key: 'daftar', label: 'Daftar', title: 'Mulai dari satu akun', subtitle: 'Gratis, langsung bisa latihan SKD.', image: '/landing/shot-dashboard.webp', framed: true, mascot: '/maskot/section-langkah.webp' },
      { key: 'latihan', label: 'Latihan', title: 'Latihan per materi', subtitle: 'TWK, TIU, dan TKP dengan pembahasan langsung.', image: '/landing/shot-latihan.webp', framed: true, mascot: '/maskot/section-skd.webp' },
      {
        key: 'tryout',
        label: 'Tryout',
        title: 'Tryout seperti CAT BKN',
        subtitle: '110 soal, 100 menit, timer dari server.',
        video: '/video/tutorial-2.webm',
        poster: '/video/tutorial-2-poster.jpg',
        start: 23,
        duration: 8000,
        mascot: '/maskot/tryout.webp',
      },
      { key: 'hasil', label: 'Hasil', title: 'Tahu bagian yang perlu dikejar', subtitle: 'Skor per subtes, passing grade, dan peringkat.', image: '/landing/shot-hasil.webp', framed: true, mascot: '/maskot/section-cta.webp' },
    ],
  },
};

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Deep-merge `server` di atas `defaults`. Objek digabung per key; array dari server mengganti utuh;
 * nilai null/undefined dari server mempertahankan default (brand.logo_url default-nya null → logo bawaan).
 */
export function mergeSite(defaults, server) {
  if (!isPlainObject(server)) return defaults;
  if (!isPlainObject(defaults)) return server;
  const out = { ...defaults };
  for (const [k, v] of Object.entries(server)) {
    if (v === undefined || v === null) continue;
    const d = defaults[k];
    if (isPlainObject(d) && isPlainObject(v)) out[k] = mergeSite(d, v);
    else if (isPlainObject(d) && !isPlainObject(v)) continue; // tipe salah → abaikan
    else if (Array.isArray(d) && !Array.isArray(v)) continue; // tipe salah → abaikan
    else out[k] = v;
  }
  return out;
}

/** Judul beranda: `${name} — ${tagline}` (tanpa tagline → nama saja). */
export function siteTitle(site) {
  const name = site?.brand?.name || SITE_DEFAULTS.brand.name;
  const tagline = site?.brand?.tagline;
  return tagline ? `${name} — ${tagline}` : name;
}

/** true bila section (id) tidak disembunyikan. id tak dikenal dianggap terlihat. */
export function sectionVisible(site, id) {
  const key = id === 'beranda' ? 'hero' : id;
  return site?.sections?.[key]?.visible !== false;
}

export default SITE_DEFAULTS;
