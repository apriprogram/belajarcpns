import { formatJam, formatTanggal, isoDay } from '@/lib/format';

/** Konstanta & helper bersama halaman peserta. */

export const SUBTESTS = [
  { code: 'TWK', name: 'Tes Wawasan Kebangsaan', short: 'Wawasan Kebangsaan' },
  { code: 'TIU', name: 'Tes Intelegensia Umum', short: 'Intelegensia Umum' },
  { code: 'TKP', name: 'Tes Karakteristik Pribadi', short: 'Karakteristik Pribadi' },
];

export const SUBTEST_NAME = Object.fromEntries(SUBTESTS.map((s) => [s.code, s.name]));

/** Kelas warna per subtes (selaras SUBTEST_COLOR: TWK cobalt, TIU warning, TKP mint). */
export const SUBTEST_TONE = {
  TWK: { bg: 'bg-cobalt-50', ring: 'ring-cobalt-100', text: 'text-cobalt-700', fill: 'bg-cobalt', hex: '#3765F6' },
  TIU: { bg: 'bg-warning-50', ring: 'ring-warning/25', text: 'text-warning-700', fill: 'bg-warning', hex: '#F5B301' },
  TKP: { bg: 'bg-mint-50', ring: 'ring-mint-100', text: 'text-mint-700', fill: 'bg-mint-700', hex: '#14833A' },
  SKD: { bg: 'bg-mist-50', ring: 'ring-mist-100', text: 'text-obsidian-600', fill: 'bg-obsidian', hex: '#181D25' },
};

/** Skor maksimum per soal (TWK/TIU benar = 5, TKP bobot maks 5). */
export const POINTS_PER_QUESTION = 5;

export const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

/** Kode pendek dari UUID untuk ditampilkan monospace, mis. "#2D057B". */
export const shortCode = (id = '') => `#${String(id).replace(/-/g, '').slice(0, 6).toUpperCase()}`;

/** Jam di Jakarta (0–23) untuk sapaan. */
export function jakartaHour(d = new Date()) {
  return Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(d)) % 24;
}

export function greeting(d = new Date()) {
  const h = jakartaHour(d);
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/** Escape satu sel CSV (pemisah ;). */
export function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Unduh string CSV (BOM UTF-8 agar terbaca Excel berlocale Indonesia). */
export function downloadCsv(filename, rows) {
  const content = '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Teks jadwal paket ringkas. */
export function schedule(p) {
  if (!p.start_at && !p.end_at) return 'Kapan saja';
  if (p.start_at && p.end_at && isoDay(p.start_at) === isoDay(p.end_at)) return `${formatTanggal(p.start_at, 'day-month')}, ${formatJam(p.start_at)}–${formatJam(p.end_at)}`;
  if (p.start_at && p.end_at) return `${formatTanggal(p.start_at, 'day-month')} – ${formatTanggal(p.end_at, 'day-month')}`;
  if (p.start_at) return `Mulai ${formatTanggal(p.start_at, 'day-month')}, ${formatJam(p.start_at)}`;
  return `Sampai ${formatTanggal(p.end_at, 'day-month')}, ${formatJam(p.end_at)}`;
}
