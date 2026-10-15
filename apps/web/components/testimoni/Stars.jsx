'use client';

import { useId, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Label tiap jumlah bintang (dipakai form peserta & admin). */
export const RATING_LABELS = { 1: 'Kurang', 2: 'Cukup', 3: 'Baik', 4: 'Sangat baik', 5: 'Luar biasa' };

/** Batas panjang isi testimoni (sama dengan validasi server). */
export const TESTIMONI_MIN = 20;
export const TESTIMONI_MAX = 500;

/** Rapikan isi seperti server: CRLF → LF, trim, maksimal satu baris kosong berturut-turut. */
export const normalizeTestimoni = (s = '') =>
  String(s)
    .replace(/\r\n/g, '\n')
    .trim()
    .replace(/\n{3,}/g, '\n\n');

/** Panjang dalam karakter (bukan byte/UTF-16 unit), setelah dirapikan. */
export const testimoniLength = (s = '') => Array.from(normalizeTestimoni(s)).length;

/** Status testimoni → label & warna (untuk Badge tone). */
export const TESTIMONI_STATUS = {
  pending: { label: 'Menunggu ditinjau', short: 'Menunggu', tone: 'warning' },
  published: { label: 'Ditampilkan', short: 'Ditampilkan', tone: 'mint' },
  hidden: { label: 'Disembunyikan', short: 'Disembunyikan', tone: 'mist' },
};

const STAR_SIZES = { xs: 'h-3.5 w-3.5', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-8 w-8' };

/** Tampilan bintang statis (read-only). */
export function StarRating({ value = 0, size = 'sm', className }) {
  const v = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${v} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden className={cn(STAR_SIZES[size] || STAR_SIZES.sm, i <= v ? 'fill-warning text-warning' : 'fill-mist-100 text-mist')} strokeWidth={1.5} />
      ))}
    </span>
  );
}

/**
 * Input bintang 1–5 (aria radiogroup): hover = pratinjau, ←/→ (dan ↑/↓, Home/End) mengubah nilai.
 * value · onChange(n) · invalid · size: md | lg · showLabel · id · describedBy
 */
export function StarInput({ value = 0, onChange, invalid, size = 'lg', showLabel = true, id, describedBy, ariaLabel = 'Penilaian bintang', disabled }) {
  const [hover, setHover] = useState(0);
  const refs = useRef([]);
  const autoId = useId();
  const labelId = `${id || autoId}-label`;
  const shown = hover || value;

  const pick = (n) => {
    if (disabled) return;
    onChange && onChange(n);
  };

  const onKeyDown = (e, i) => {
    let n = null;
    const cur = value || 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') n = Math.min(5, cur + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') n = Math.max(1, cur - 1);
    else if (e.key === 'Home') n = 1;
    else if (e.key === 'End') n = 5;
    else if (e.key === ' ' || e.key === 'Enter') n = i + 1;
    if (n == null) return;
    e.preventDefault();
    pick(n);
    refs.current[n - 1]?.focus();
  };

  // Roving tabindex: hanya bintang terpilih (atau bintang pertama bila belum ada) yang bisa di-Tab.
  const tabStop = value ? value - 1 : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div
        id={id}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-describedby={[showLabel ? labelId : null, describedBy].filter(Boolean).join(' ') || undefined}
        aria-invalid={invalid || undefined}
        className={cn('inline-flex items-center gap-1 rounded-2xl p-1', invalid && 'ring-2 ring-danger/40')}
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((n, i) => {
          const on = n <= shown;
          return (
            <button
              key={n}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} bintang — ${RATING_LABELS[n]}`}
              tabIndex={i === tabStop ? 0 : -1}
              disabled={disabled}
              onClick={() => pick(n)}
              onMouseEnter={() => !disabled && setHover(n)}
              onFocus={() => setHover(0)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'flex items-center justify-center rounded-xl transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:cursor-not-allowed disabled:opacity-60',
                size === 'lg' ? 'h-11 w-11' : 'h-9 w-9',
                !disabled && 'hover:scale-110 active:scale-95',
              )}
            >
              <Star
                aria-hidden
                strokeWidth={1.5}
                className={cn(size === 'lg' ? 'h-8 w-8' : 'h-6 w-6', 'transition-colors', on ? 'fill-warning text-warning' : 'fill-white text-mist')}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span id={labelId} aria-live="polite" className={cn('min-w-[96px] text-sm font-semibold', shown ? 'text-obsidian' : 'text-mist-500')}>
          {shown ? `${shown}/5 · ${RATING_LABELS[shown]}` : 'Belum dipilih'}
        </span>
      )}
    </div>
  );
}

/** Penghitung karakter dengan batas min/max. */
export function CharCounter({ length, min = TESTIMONI_MIN, max = TESTIMONI_MAX, id, className }) {
  const short = length < min;
  const over = length > max;
  return (
    <p id={id} className={cn('text-[12px] font-medium tabular-nums', over ? 'text-danger-700' : short ? 'text-mist-700' : 'text-mint-700', className)} aria-live="polite">
      {length}/{max}
      {short && <span className="font-normal"> · minimal {min} karakter (kurang {min - length})</span>}
      {over && <span className="font-normal"> · kelebihan {length - max} karakter</span>}
    </p>
  );
}
