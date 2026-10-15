import 'server-only';
import { absoluteUrl, alternateNames, seoDescription, siteUrl } from '@/lib/seo';
import { ARTICLES, loadArticle } from '@/lib/panduan';

/*
 * Isi /llms.txt & /llms-full.txt (konvensi https://llmstxt.org) untuk mesin pencari AI.
 * Fakta SKD mengikuti docs/SEO.md (acuan seleksi CPNS 2024, KepmenPANRB No. 321 Tahun 2024) — jangan mengarang.
 */

export const OFFICIAL_SOURCES = [
  { label: 'SSCASN BKN', url: 'https://sscasn.bkn.go.id', note: 'portal resmi pendaftaran & pengumuman seleksi CASN' },
  { label: 'Badan Kepegawaian Negara (BKN)', url: 'https://www.bkn.go.id', note: 'penyelenggara seleksi dengan sistem CAT' },
  { label: 'Kementerian PANRB', url: 'https://www.menpan.go.id', note: 'regulasi formasi & nilai ambang batas (KepmenPANRB)' },
];

const FACTS = [
  'Gratis dan tanpa iklan: daftar akun, latihan soal, dan tryout tidak dipungut biaya.',
  'Bukan situs resmi BKN/pemerintah — platform latihan mandiri untuk persiapan Seleksi Kompetensi Dasar (SKD) CPNS.',
  'Format tryout mengikuti SKD seleksi CPNS terakhir (CPNS 2024, KepmenPANRB No. 321 Tahun 2024): 110 soal dalam 100 menit.',
  'TWK (Tes Wawasan Kebangsaan): 30 soal, benar 5, salah/kosong 0, nilai maksimal 150, passing grade 65.',
  'TIU (Tes Intelegensia Umum): 35 soal, benar 5, salah/kosong 0, nilai maksimal 175, passing grade 80.',
  'TKP (Tes Karakteristik Pribadi): 45 soal, nilai 1–5 per opsi (tanpa jawaban salah), nilai maksimal 225, passing grade 166.',
  'Total nilai maksimal 550. Lulus SKD bila setiap subtes mencapai passing grade-nya; peserta yang lulus lalu diperingkat berdasarkan total nilai, dan yang lanjut ke SKB maksimal 3× jumlah kebutuhan formasi.',
  'Jalur khusus (KepmenPANRB 321/2024): lulusan cumlaude & diaspora → total ≥ 311 dan TIU ≥ 85; penyandang disabilitas & putra/putri Papua → total ≥ 286 dan TIU ≥ 60.',
  'Nilai dan aturan bisa berubah untuk CPNS 2027. Jadwal dan formasi CPNS 2026/2027 belum diumumkan resmi (per Oktober 2026); BKN memperingatkan poster/tautan pendaftaran palsu — percayai hanya sscasn.bkn.go.id, bkn.go.id, dan menpan.go.id.',
];

const FEATURES = [
  'Tryout CBT SKD 110 soal / 100 menit yang meniru CAT BKN: panel nomor soal, tanda ragu-ragu, konfirmasi selesai.',
  'Timer dihitung di server; jawaban tersimpan otomatis dan ujian bisa dilanjutkan setelah koneksi putus atau halaman dimuat ulang.',
  'Latihan soal per sub-materi TWK, TIU, dan TKP dengan pembahasan langsung setelah menjawab.',
  'Hasil: skor per subtes, status lulus terhadap passing grade, peringkat, dan pembahasan tiap soal.',
  'Analisis & grafik progres, riwayat ujian, dan target belajar harian.',
  'Live group chat sesama peserta, testimoni peserta, serta kirim pesan ke admin/developer.',
];

const line = (label, url, note) => `- [${label}](${url})${note ? `: ${note}` : ''}`;

/** Bagian kepala bersama: judul, ringkasan, tentang, fitur, halaman penting, sumber resmi. */
export function llmsHeader(site, { full = false } = {}) {
  const name = site?.brand?.name || 'BELAJAR CPNS';
  const alt = alternateNames(site);
  const desc = seoDescription(site);
  const out = [];
  out.push(`# ${name}`, '');
  out.push(
    `> ${name} adalah platform belajar CPNS gratis berbahasa Indonesia: latihan soal dan tryout CAT SKD (TWK, TIU, TKP) 110 soal / 100 menit dengan timer server, pembahasan, skor per subtes, status passing grade, dan peringkat. Bukan situs resmi BKN.`,
    '',
  );
  if (desc) out.push(desc, '');
  out.push(`Situs: ${siteUrl(site)}/`);
  if (alt.length) out.push(`Nama lain: ${alt.join(', ')}`);
  out.push('Bahasa: Indonesia', '');

  out.push('## Tentang', '', ...FACTS.map((f) => `- ${f}`), '');
  out.push('## Fitur', '', ...FEATURES.map((f) => `- ${f}`), '');

  out.push(
    '## Halaman penting',
    '',
    line('Beranda', absoluteUrl(site, '/'), 'ringkasan fitur, struktur SKD, testimoni, dan FAQ'),
    line('Daftar gratis', absoluteUrl(site, '/daftar'), 'buat akun untuk mulai latihan & tryout CPNS'),
    line('Panduan belajar CPNS', absoluteUrl(site, '/panduan'), 'kumpulan artikel persiapan SKD CPNS 2027'),
    ...ARTICLES.map((a) => line(a.title, absoluteUrl(site, `/panduan/${a.slug}`), a.description)),
    line('Tentang', absoluteUrl(site, '/tentang'), `tentang ${name} dan cara kerjanya`),
    '',
  );

  out.push('## Sumber resmi', '', ...OFFICIAL_SOURCES.map((s) => line(s.label, s.url, s.note)), '');

  if (!full) {
    out.push('## Optional', '', line('Teks lengkap semua panduan', absoluteUrl(site, '/llms-full.txt'), 'isi artikel dalam Markdown'), '');
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ */
/* Artikel (skema docs/SEO.md) → Markdown                               */
/* ------------------------------------------------------------------ */

/** Teks inline: **tebal** dipertahankan, tautan internal "/..." dijadikan absolut. */
function inline(site, text) {
  return String(text ?? '').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => `[${label}](${url.startsWith('/') ? absoluteUrl(site, url) : url})`);
}

const cell = (site, v) => inline(site, v).replace(/\|/g, '\\|').replace(/\n+/g, ' ');

function blockToMd(site, b) {
  if (!b || typeof b !== 'object') return '';
  switch (b.type) {
    case 'p':
      return inline(site, b.text);
    case 'h3':
      return `#### ${inline(site, b.text)}`;
    case 'ul':
      return (b.items || []).map((it) => `- ${inline(site, it)}`).join('\n');
    case 'ol':
      return (b.items || []).map((it, i) => `${i + 1}. ${inline(site, it)}`).join('\n');
    case 'table': {
      const head = Array.isArray(b.head) ? b.head : [];
      const rows = Array.isArray(b.rows) ? b.rows : [];
      const cols = Math.max(head.length, ...rows.map((r) => (Array.isArray(r) ? r.length : 0)), 1);
      const pad = (r) => Array.from({ length: cols }, (_, i) => cell(site, (r || [])[i] ?? ''));
      return [`| ${pad(head).join(' | ')} |`, `| ${Array(cols).fill('---').join(' | ')} |`, ...rows.map((r) => `| ${pad(r).join(' | ')} |`)].join('\n');
    }
    case 'callout': {
      const title = b.title ? `**${inline(site, b.title).replace(/[.:!?]$/, '')}:** ` : '';
      return `> ${title}${inline(site, b.text)}`.replace(/\n/g, '\n> ');
    }
    case 'question': {
      const out = [`**Contoh soal${b.label ? ` ${b.label}` : ''}:** ${inline(site, b.text)}`, ''];
      (b.options || []).forEach((o) => out.push(`- ${inline(site, o)}`));
      if (b.answer) out.push('', `Jawaban: **${b.answer}**`);
      if (b.explanation) out.push('', `Pembahasan: ${inline(site, b.explanation)}`);
      return out.join('\n');
    }
    default:
      return b.text ? inline(site, b.text) : '';
  }
}

/** Satu artikel → Markdown. null bila isi belum ada. */
export async function articleMarkdown(site, meta) {
  const body = await loadArticle(meta.slug);
  if (!body || typeof body !== 'object') return null;
  const out = [`## ${meta.title}`, ''];
  out.push(`URL: ${absoluteUrl(site, `/panduan/${meta.slug}`)}`);
  const dates = [meta.datePublished && `Terbit: ${meta.datePublished}`, meta.dateModified && `Diperbarui: ${meta.dateModified}`].filter(Boolean);
  if (dates.length) out.push(dates.join(' · '));
  if (meta.category) out.push(`Kategori: ${meta.category}`);
  out.push('');
  if (meta.description) out.push(`> ${meta.description}`, '');
  if (body.intro) out.push(inline(site, body.intro), '');
  for (const sec of Array.isArray(body.sections) ? body.sections : []) {
    if (!sec) continue;
    if (sec.title) out.push(`### ${inline(site, sec.title)}`, '');
    for (const b of Array.isArray(sec.blocks) ? sec.blocks : []) {
      const md = blockToMd(site, b);
      if (md) out.push(md, '');
    }
  }
  const faq = (Array.isArray(body.faq) ? body.faq : []).filter((f) => f && f.q && f.a);
  if (faq.length) {
    out.push('### Pertanyaan umum', '');
    faq.forEach((f) => out.push(`**${inline(site, f.q)}**`, '', inline(site, f.a), ''));
  }
  const sources = (Array.isArray(body.sources) ? body.sources : []).filter((s) => s && s.url);
  if (sources.length) {
    out.push('### Sumber', '');
    sources.forEach((s) => out.push(line(s.label || s.url, s.url.startsWith('/') ? absoluteUrl(site, s.url) : s.url)));
    out.push('');
  }
  return out.join('\n');
}

/** Teks lengkap: kepala + semua artikel yang isinya sudah ada (yang belum ada dilewati). */
export async function llmsFull(site) {
  const parts = await Promise.all(
    ARTICLES.map(async (meta) => {
      try {
        return await articleMarkdown(site, meta);
      } catch {
        return null;
      }
    }),
  );
  const articles = parts.filter(Boolean);
  const out = [llmsHeader(site, { full: true }), '---', '', '# Panduan lengkap', ''];
  if (articles.length) out.push(articles.join('\n---\n\n'));
  else out.push(`Isi panduan sedang disiapkan. Lihat ${absoluteUrl(site, '/panduan')}`, '');
  return out.join('\n');
}

export function textResponse(body) {
  return new Response(body.endsWith('\n') ? body : `${body}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex',
    },
  });
}
