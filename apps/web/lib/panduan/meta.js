/**
 * Metadata artikel Panduan (tanpa isi) — aman diimpor dari middleware/edge. Isi ada di ./articles/<slug>.js.
 */
export const PANDUAN_PUBLISHED = '2026-10-15';

export const ARTICLES = [
  {
    slug: 'belajar-cpns-dari-nol',
    title: 'Cara Belajar CPNS dari Nol untuk Pemula',
    metaTitle: 'Cara Belajar CPNS dari Nol: Panduan SKD 2027 untuk Pemula',
    description: 'Panduan belajar CPNS dari nol: kenali SKD (TWK, TIU, TKP), susun jadwal belajar, latihan soal bertahap, dan tryout CAT gratis sampai siap ujian.',
    keywords: ['belajar cpns', 'belajar cpns dari nol', 'cara belajar cpns', 'persiapan cpns 2027', 'belajar skd'],
    category: 'Strategi',
    readMinutes: 7,
    datePublished: '2026-10-15',
    dateModified: '2026-10-15',
  },
  {
    slug: 'cara-jadi-pns',
    title: 'Cara Jadi PNS: Syarat & Tahapan Seleksi CPNS',
    metaTitle: 'Cara Jadi PNS: Syarat dan Tahapan Seleksi CPNS Lengkap',
    description: 'Cara jadi PNS lewat seleksi CPNS: syarat umum, pendaftaran di SSCASN, seleksi administrasi, SKD dengan CAT BKN, SKB, hingga pengangkatan dan NIP.',
    keywords: ['jadi pns', 'cara jadi pns', 'syarat cpns', 'tahapan seleksi cpns', 'daftar cpns'],
    category: 'Seleksi CPNS',
    readMinutes: 5,
    datePublished: '2026-10-15',
    dateModified: '2026-10-15',
  },
  {
    slug: 'materi-skd-cpns',
    title: 'Materi SKD CPNS: Kisi-kisi TWK, TIU, dan TKP',
    metaTitle: 'Materi SKD CPNS Lengkap: Kisi-kisi TWK, TIU, dan TKP',
    description: 'Kisi-kisi materi SKD CPNS: Tes Wawasan Kebangsaan (TWK), Tes Intelegensia Umum (TIU), dan Tes Karakteristik Pribadi (TKP), lengkap dengan sub-materi dan cara belajarnya.',
    keywords: ['materi skd', 'kisi-kisi skd', 'materi twk', 'materi tiu', 'materi tkp', 'materi cpns'],
    category: 'Materi',
    readMinutes: 5,
    datePublished: '2026-10-15',
    dateModified: '2026-10-15',
  },
  {
    slug: 'passing-grade-skd',
    title: 'Passing Grade SKD CPNS & Cara Menghitung Nilai',
    metaTitle: 'Passing Grade SKD CPNS dan Cara Menghitung Nilai TWK, TIU, TKP',
    description: 'Passing grade SKD CPNS (acuan seleksi terakhir: TWK 65, TIU 80, TKP 166), sistem penilaian tiap subtes, skor maksimal 550, dan cara menghitung nilaimu.',
    keywords: ['passing grade skd', 'passing grade cpns', 'nilai ambang batas skd', 'cara menghitung nilai skd', 'nilai skd'],
    category: 'Penilaian',
    readMinutes: 5,
    datePublished: '2026-10-15',
    dateModified: '2026-10-15',
  },
  {
    slug: 'tryout-cpns-gratis',
    title: 'Tryout CPNS Online Gratis dengan Sistem CAT',
    metaTitle: 'Tryout CPNS Online Gratis Sistem CAT BKN: 110 Soal 100 Menit',
    description: 'Tryout CPNS online gratis yang meniru CAT BKN: 110 soal SKD dalam 100 menit, timer server, simpan otomatis, skor per subtes, peringkat, dan pembahasan.',
    keywords: ['tryout cpns gratis', 'tryout skd online', 'simulasi cat bkn', 'tryout cat cpns', 'to cpns gratis'],
    category: 'Tryout',
    readMinutes: 5,
    datePublished: '2026-10-15',
    dateModified: '2026-10-15',
  },
  {
    slug: 'contoh-soal-skd',
    title: 'Contoh Soal SKD CPNS + Pembahasan',
    metaTitle: 'Contoh Soal SKD CPNS (TWK, TIU, TKP) Beserta Pembahasan',
    description: 'Contoh soal SKD CPNS untuk TWK, TIU, dan TKP beserta kunci jawaban dan pembahasan singkat, cocok untuk pemanasan sebelum tryout.',
    keywords: ['contoh soal skd', 'soal cpns', 'soal twk', 'soal tiu', 'soal tkp', 'latihan soal cpns'],
    category: 'Latihan',
    readMinutes: 8,
    datePublished: '2026-10-15',
    dateModified: '2026-10-15',
  },
  {
    slug: 'tips-lolos-skd',
    title: 'Tips Lolos SKD CPNS: Strategi Belajar & Saat Ujian',
    metaTitle: 'Tips Lolos SKD CPNS: Strategi Belajar dan Mengerjakan CAT',
    description: 'Tips lolos SKD CPNS: prioritaskan passing grade tiap subtes, atur waktu 100 menit, strategi mengerjakan TWK, TIU, TKP, dan evaluasi lewat tryout rutin.',
    keywords: ['tips lolos skd', 'tips lolos cpns', 'strategi skd', 'cara lolos cpns', 'tips cat bkn'],
    category: 'Strategi',
    readMinutes: 5,
    datePublished: '2026-10-15',
    dateModified: '2026-10-15',
  },
];

// readMinutes = perkiraan dari isi artikel (≈200 kata/menit, lib/panduan/text.js → readMinutes); perbarui bila isi berubah.

export const PANDUAN_SLUGS = ARTICLES.map((a) => a.slug);
