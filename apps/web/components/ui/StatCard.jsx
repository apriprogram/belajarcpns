import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { renderIcon } from './_icon';

const ICON_TONES = {
  cobalt: 'text-cobalt',
  mint: 'text-mint-700',
  warning: 'text-warning-700',
  danger: 'text-danger',
  mist: 'text-obsidian-600',
  obsidian: 'text-obsidian',
};

/** Pill delta: naik = mint, turun = danger, datar = abu. */
function DeltaPill({ dir, dark, children }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2 text-xs font-semibold tabular-nums',
        dir === 'up' && (dark ? 'bg-mint/15 text-mint' : 'bg-mint-50 text-mint-700'),
        dir === 'down' && (dark ? 'bg-danger/20 text-white' : 'bg-danger-50 text-danger-700'),
        dir === 'flat' && (dark ? 'bg-white/10 text-white/70' : 'bg-ghost text-mist-700'),
      )}
    >
      {children}
    </span>
  );
}

/**
 * Kartu statistik (gaya dashboard medis): judul (+ info) & aksi di atas → kotak ikon + angka besar + pill delta
 * → mini chart (opsional) + keterangan kecil.
 * label · value · suffix (mis. "%", "/550") · icon · tone (warna ikon) · info (teks ikon (i))
 * trend: number (persen, +/-) atau { value, label } → pill "+12%" · trendLabel ("vs minggu lalu")
 * delta: teks/angka pill bebas (mis. "+115"; awalan "-" = turun) · hint / caption: keterangan kecil
 * chart: slot mini chart/bar di kiri bawah · action: elemen kanan atas (mis. <Button size="sm" variant="secondary">)
 * variant: 'white' | 'ghost' | 'obsidian' · loading: skeleton
 */
export function StatCard({ label, value, suffix, icon, tone = 'cobalt', trend, trendLabel = 'vs minggu lalu', delta, hint, caption, chart, info, variant = 'white', loading, className, action }) {
  const t = trend && typeof trend === 'object' ? trend : trend !== undefined && trend !== null ? { value: trend } : null;
  const dir = t ? (t.value > 0 ? 'up' : t.value < 0 ? 'down' : 'flat') : null;
  const deltaDir = delta != null ? (String(delta).trim().startsWith('-') || String(delta).trim().startsWith('−') ? 'down' : String(delta).trim().replace(/[+%\s]/g, '') === '0' ? 'flat' : 'up') : null;
  const dark = variant === 'obsidian';
  const muted = dark ? 'text-white/60' : 'text-mist-700';
  const capText = caption ?? (t ? [t.label || trendLabel, hint].filter(Boolean).join(' · ') : hint);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-[20px] p-5',
        variant === 'white' && 'bg-white ring-1 ring-inset ring-mist-100',
        variant === 'ghost' && 'bg-ghost',
        dark && 'glow-cobalt-dark overflow-hidden bg-obsidian text-white',
        className,
      )}
    >
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className={cn('truncate text-sm font-semibold', dark ? 'text-white' : 'text-obsidian')}>{label}</p>
          {info && (
            <span title={typeof info === 'string' ? info : undefined} aria-label={typeof info === 'string' ? info : 'Info'} role="img" className={cn('inline-flex', dark ? 'text-white/50' : 'text-mist-500')}>
              <Info className="h-4 w-4" aria-hidden />
            </span>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>

      <div className="flex items-center gap-3">
        {icon && (
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', dark ? 'bg-white/10 text-mint' : cn('bg-white ring-1 ring-inset ring-mist-100', ICON_TONES[tone] || ICON_TONES.cobalt))}>
            {renderIcon(icon, 'h-[18px] w-[18px]')}
          </span>
        )}
        {loading ? (
          <div className={cn('h-9 w-28 animate-pulse rounded-xl', dark ? 'bg-white/10' : 'bg-mist-100')} />
        ) : (
          <p className="flex min-w-0 items-baseline gap-1 text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
            <span className="truncate">{value ?? '—'}</span>
            {suffix && <span className={cn('text-base font-medium tracking-tight', dark ? 'text-white/50' : 'text-mist-500')}>{suffix}</span>}
          </p>
        )}
        {!loading && t && (
          <DeltaPill dir={dir} dark={dark}>
            {t.value > 0 ? '+' : t.value < 0 ? '−' : ''}
            {Math.abs(t.value)}%
          </DeltaPill>
        )}
        {!loading && delta != null && (
          <DeltaPill dir={deltaDir} dark={dark}>
            {delta}
          </DeltaPill>
        )}
      </div>

      {(chart || capText) && (
        <div className={cn('flex gap-4', chart ? 'items-end' : 'items-center')}>
          {chart && <div className="min-w-0 flex-1">{chart}</div>}
          {capText && <p className={cn('text-xs leading-relaxed', muted, chart && 'max-w-[48%]')}>{capText}</p>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
