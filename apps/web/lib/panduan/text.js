/**
 * Utilitas teks artikel Panduan (server & client, tanpa dependensi).
 * Format inline yang didukung: `**tebal**` dan `[label](url)` (lihat docs/SEO.md).
 */

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Teks polos tanpa penanda inline (untuk JSON-LD, meta, hitung kata). */
export function toPlain(text) {
  return String(text || '')
    .replace(LINK_RE, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const words = (text) => {
  const t = toPlain(text);
  return t ? t.split(' ').length : 0;
};

/** Semua potongan teks yang tampil di artikel (intro, judul, blok, FAQ). */
export function articleTexts(body) {
  if (!body) return [];
  const out = [body.intro];
  for (const s of body.sections || []) {
    out.push(s.title);
    for (const b of s.blocks || []) {
      if (b.text) out.push(b.text);
      if (b.title) out.push(b.title);
      if (Array.isArray(b.items)) out.push(...b.items);
      if (Array.isArray(b.head)) out.push(...b.head);
      if (Array.isArray(b.rows)) b.rows.forEach((r) => out.push(...r));
      if (Array.isArray(b.options)) out.push(...b.options);
      if (b.explanation) out.push(b.explanation);
    }
  }
  for (const f of body.faq || []) out.push(f.q, f.a);
  return out.filter(Boolean).map(String);
}

/** Jumlah kata isi artikel. */
export function wordCount(body) {
  return articleTexts(body).reduce((n, t) => n + words(t), 0);
}

/** Perkiraan menit baca (≈200 kata/menit, bahasa Indonesia). Tanpa isi → fallback. */
export function readMinutes(body, fallback = 5) {
  const n = wordCount(body);
  return n ? Math.max(1, Math.round(n / 200)) : fallback;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** "2026-10-15" → "15 Oktober 2026" (tanpa pengaruh zona waktu). */
export function formatDateId(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] || ''} ${m[1]}`;
}

/** Pisahkan huruf opsi di depan teks ("A. Teks" / "A) Teks" / "A Teks") → { letter, text }. */
export function splitOption(raw, index) {
  const s = String(raw || '');
  const m = /^\s*([A-E])(?:[.)]\s*|\s+)(.*)$/s.exec(s);
  if (m) return { letter: m[1], text: m[2] };
  return { letter: String.fromCharCode(65 + index), text: s };
}
