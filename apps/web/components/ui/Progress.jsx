import { cn } from '@/lib/cn';

const FILL = {
  cobalt: 'bg-cobalt',
  mint: 'bg-mint',
  'mint-dark': 'bg-mint-700',
  obsidian: 'bg-obsidian',
  warning: 'bg-warning',
  danger: 'bg-danger',
};
const HEIGHT = { xs: 'h-1', sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

/**
 * Bar progres tunggal.
 * value · max (default 100) · color: cobalt | mint | mint-dark | obsidian | warning | danger
 * size: xs | sm | md | lg · label (kiri atas) · showValue (kanan atas, persen)
 * marker: nilai ambang (mis. passing grade) — garis tipis vertikal
 */
export function ProgressBar({ value = 0, max = 100, color = 'cobalt', size = 'md', label, showValue, valueText, marker, className, trackClassName }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (Number(value) / max) * 100)) : 0;
  const markerPct = marker != null && max > 0 ? Math.min(100, Math.max(0, (marker / max) * 100)) : null;
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          {label && <span className="font-medium text-obsidian-600">{label}</span>}
          {showValue && <span className="font-semibold tabular-nums text-obsidian">{valueText ?? `${Math.round(pct)}%`}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Number(value) || 0}
        aria-label={typeof label === 'string' ? label : undefined}
        className={cn('relative w-full overflow-hidden rounded-full bg-mist-100', HEIGHT[size] || HEIGHT.md, trackClassName)}
      >
        <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', FILL[color] || FILL.cobalt)} style={{ width: `${pct}%` }} />
        {markerPct != null && <span className="absolute inset-y-0 w-0.5 bg-obsidian/60" style={{ left: `calc(${markerPct}% - 1px)` }} aria-hidden />}
      </div>
    </div>
  );
}

/**
 * Progres bersegmen (checklist "2/4").
 * total: jumlah segmen · value: segmen terisi · color · showCount ("2/4" di kanan) · label
 */
export function SegmentedProgress({ total = 4, value = 0, color = 'mint-dark', size = 'sm', label, showCount = true, className }) {
  const n = Math.max(1, Math.min(total, 60));
  const filled = Math.max(0, Math.min(n, Math.round(value)));
  return (
    <div className={cn('w-full', className)}>
      {(label || showCount) && (
        <div className="mb-2 flex items-center justify-between text-xs">
          {label ? <span className="text-mist-700">{label}</span> : <span />}
          {showCount && (
            <span className="font-semibold tabular-nums text-obsidian">
              {filled}/{total}
            </span>
          )}
        </div>
      )}
      <div className="flex w-full gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={filled}>
        {Array.from({ length: n }).map((_, i) => (
          <span
            key={i}
            className={cn('flex-1 rounded-full transition-colors duration-300', HEIGHT[size] || HEIGHT.sm, i < filled ? FILL[color] || FILL['mint-dark'] : 'bg-mist-100')}
          />
        ))}
      </div>
    </div>
  );
}

export default ProgressBar;
