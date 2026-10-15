import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Chip, SUBTEST_COLOR } from '@/components/ui';
import { SUBTESTS, SUBTEST_BG } from './shared';

const TONES = {
  cobalt: 'bg-cobalt-50 text-cobalt',
  mint: 'bg-mint-100 text-mint-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger',
  mist: 'bg-ghost text-obsidian-600',
  obsidian: 'bg-obsidian text-mint',
};

/**
 * Kartu angka besar gaya referensi: ikon bulat + tombol panah bulat, label pill di kanan,
 * angka besar di bawah. href → panah menjadi tautan.
 */
export function MetricCard({ label, value, suffix, icon, tone = 'cobalt', href, hint, loading, className }) {
  return (
    <div className={cn('flex min-h-[156px] min-w-0 flex-col justify-between gap-5 rounded-[20px] bg-white p-5 ring-1 ring-inset ring-mist-100 sm:min-h-[168px]', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', TONES[tone] || TONES.cobalt)} aria-hidden>
            {icon}
          </span>
          {href && (
            <Link
              href={href}
              aria-label={`Buka ${label}`}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-obsidian-600 ring-1 ring-inset ring-mist-100 transition-colors hover:bg-ghost hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
            >
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <span className="max-w-[60%] truncate rounded-full bg-ghost px-3 py-1.5 text-xs font-medium text-obsidian-600">{label}</span>
      </div>
      <div>
        {loading ? (
          <div className="h-12 w-28 animate-pulse rounded-xl bg-mist-100" />
        ) : (
          <p className="flex items-baseline gap-1.5 text-[44px] font-semibold leading-none tracking-tightest tabular-nums text-obsidian sm:text-5xl">
            {value ?? '—'}
            {suffix && <span className="text-lg font-medium tracking-tight text-mist-500">{suffix}</span>}
          </p>
        )}
        {hint && <p className="mt-3 truncate text-xs text-mist-700">{hint}</p>}
      </div>
    </div>
  );
}

/** Chip subtes dengan warna standar. */
export function SubtestChip({ code, size = 'sm', className }) {
  return (
    <Chip color={SUBTEST_COLOR[code] || 'mist'} size={size} mono className={cn('font-semibold', className)}>
      {code}
    </Chip>
  );
}

/**
 * Bar komposisi bersegmen TWK/TIU/TKP. counts: {TWK,TIU,TKP} · target opsional (mis. 110)
 * showLegend: tampilkan angka per subtes.
 */
export function CompositionBar({ counts = {}, total, showLegend = true, size = 'md', className }) {
  const sum = SUBTESTS.reduce((a, k) => a + (Number(counts[k]) || 0), 0);
  const base = Math.max(sum, total || 0) || 1;
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('flex w-full gap-1 overflow-hidden rounded-full', size === 'sm' ? 'h-1.5' : 'h-2.5')} role="img" aria-label={SUBTESTS.map((k) => `${k} ${counts[k] || 0}`).join(', ')}>
        {sum === 0 ? (
          <span className="h-full flex-1 rounded-full bg-mist-100" />
        ) : (
          <>
            {SUBTESTS.map((k) =>
              counts[k] ? <span key={k} className={cn('h-full rounded-full', SUBTEST_BG[k])} style={{ width: `${(counts[k] / base) * 100}%` }} /> : null,
            )}
            {base > sum && <span className="h-full flex-1 rounded-full bg-mist-100" />}
          </>
        )}
      </div>
      {showLegend && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mist-700">
          {SUBTESTS.map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', SUBTEST_BG[k])} aria-hidden />
              {k} <span className="font-semibold tabular-nums text-obsidian">{counts[k] || 0}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Label bagian kecil di dalam kartu/modal. */
export function SectionLabel({ children, action, className }) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <p className="text-[15px] font-semibold text-obsidian">{children}</p>
      {action}
    </div>
  );
}

/** Baris info ikon + label + nilai (gaya kolom kanan modal detail). */
export function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-center gap-3 py-2 text-sm">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-mist-500" aria-hidden>
        {icon}
      </span>
      <span className="w-28 shrink-0 text-mist-700">{label}</span>
      <span className="min-w-0 flex-1 truncate font-medium text-obsidian">{children}</span>
    </div>
  );
}

/** Grid ringkasan 4 kotak bersekat (pola modal detail). items: [{label, value, hint?}] */
export function SummaryGrid({ items = [], className }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-mist-100">
          <p className="text-xs font-medium text-mist-700">{it.label}</p>
          <p className={cn('mt-1.5 text-2xl font-semibold tracking-[-0.02em] tabular-nums', it.tone === 'mint' && 'text-mint-700', it.tone === 'danger' && 'text-danger-700')}>{it.value}</p>
          {it.hint && <p className="mt-0.5 text-[11px] text-mist-500">{it.hint}</p>}
        </div>
      ))}
    </div>
  );
}
