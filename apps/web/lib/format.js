/**
 * Format tampilan — locale id-ID, zona Asia/Jakarta.
 * Semua fungsi aman terhadap null/undefined/tanggal tidak valid (mengembalikan '—').
 */

export const TZ = 'Asia/Jakarta';
export const LOCALE = 'id-ID';
const DASH = '—';

function toDate(v) {
  if (v === null || v === undefined || v === '') return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "12 Okt 2026" (default) · style: 'long' → "Senin, 12 Oktober 2026" · 'short' → "12/10/26" */
export function formatTanggal(v, style = 'medium') {
  const d = toDate(v);
  if (!d) return DASH;
  const opts =
    style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : style === 'short'
        ? { day: '2-digit', month: '2-digit', year: '2-digit' }
        : style === 'day-month'
          ? { day: 'numeric', month: 'short' }
          : { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat(LOCALE, { ...opts, timeZone: TZ }).format(d);
}

/** "09.30" */
export function formatJam(v) {
  const d = toDate(v);
  if (!d) return DASH;
  return new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ }).format(d);
}

/** "12 Okt 2026, 09.30 WIB" */
export function formatTanggalJam(v, { wib = true } = {}) {
  const d = toDate(v);
  if (!d) return DASH;
  return `${formatTanggal(d)}, ${formatJam(d)}${wib ? ' WIB' : ''}`;
}

/** Nama hari singkat: "Sen" */
export function formatHari(v, style = 'short') {
  const d = toDate(v);
  if (!d) return DASH;
  return new Intl.DateTimeFormat(LOCALE, { weekday: style, timeZone: TZ }).format(d);
}

/** Tanggal YYYY-MM-DD di zona Jakarta (untuk query ?day=). */
export function isoDay(v = new Date()) {
  const d = toDate(v);
  if (!d) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ }).format(d);
  return parts; // en-CA → 2026-10-12
}

/**
 * Durasi dari DETIK → "1 j 20 m", "45 m", "30 d".
 * opts.unit: 'seconds' (default) | 'minutes'
 */
export function formatDurasi(value, { unit = 'seconds', withSeconds = false } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return DASH;
  let s = Math.max(0, Math.round(Number(value) * (unit === 'minutes' ? 60 : 1)));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  const parts = [];
  if (h) parts.push(`${h} j`);
  if (m || (h && !withSeconds)) parts.push(`${m} m`);
  if ((withSeconds && sec) || (!h && !m)) parts.push(`${sec} d`);
  return parts.join(' ');
}

/** Hitung mundur "01:39:59" / "39:59" (untuk timer ujian, pakai font-mono). */
export function formatTimer(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** 1234.5 → "1.234,5" */
export function formatAngka(v, { decimals = 0, maxDecimals } = {}) {
  if (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) return DASH;
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: maxDecimals ?? decimals,
  }).format(Number(v));
}

/** Angka ringkas: 12500 → "12,5 rb" */
export function formatRingkas(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return DASH;
  return new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 }).format(Number(v));
}

/** 75 → "75%" ; 0.75 dengan {ratio:true} → "75%" */
export function formatPersen(v, { decimals = 0, ratio = false } = {}) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return DASH;
  const n = ratio ? Number(v) * 100 : Number(v);
  return `${formatAngka(n, { decimals: 0, maxDecimals: decimals })}%`;
}

/** Waktu relatif: "baru saja", "5 menit lalu", "kemarin", "dalam 2 hari" */
export function formatRelatif(v, now = new Date()) {
  const d = toDate(v);
  if (!d) return DASH;
  const diff = (d.getTime() - now.getTime()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return 'baru saja';
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, sec] of units) {
    if (abs >= sec || unit === 'minute') return rtf.format(Math.round(diff / sec), unit);
  }
  return DASH;
}

/** Inisial nama: "Budi Santoso" → "BS" */
export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Batasi teks & hapus tag HTML sederhana. */
export function excerpt(text = '', max = 120) {
  const s = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}
