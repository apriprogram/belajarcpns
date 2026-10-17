import { cn } from '@/lib/cn';

const STROKE = { cobalt: '#3765F6', mint: '#70FC8E', 'mint-dark': '#14833A', obsidian: '#181D25', warning: '#F5B301', danger: '#E5484D' };

/**
 * Gauge setengah lingkaran (SVG) dengan angka besar di tengah.
 * value · max · color · label (di bawah angka) · valueText (menimpa tampilan angka) · suffix
 * size: lebar px (default 240) · thickness · marker: nilai ambang (garis kecil, mis. passing grade)
 * children: legend/konten tambahan di bawah gauge.
 */
export function Gauge({ value = 0, max = 100, color = 'cobalt', size = 240, thickness = 22, label, valueText, suffix, marker, className, children }) {
  const w = size;
  const r = (w - thickness) / 2;
  const cx = w / 2;
  const cy = r + thickness / 2;
  const h = cy + thickness / 2;
  const len = Math.PI * r;
  const pct = max > 0 ? Math.min(1, Math.max(0, Number(value) / max)) : 0;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  let markerEl = null;
  if (marker != null && max > 0) {
    const mp = Math.min(1, Math.max(0, marker / max));
    const ang = Math.PI * (1 - mp);
    const r1 = r - thickness / 2 - 4;
    const r2 = r + thickness / 2 + 4;
    markerEl = (
      <line
        x1={cx + r1 * Math.cos(ang)}
        y1={cy - r1 * Math.sin(ang)}
        x2={cx + r2 * Math.cos(ang)}
        y2={cy - r2 * Math.sin(ang)}
        stroke="#181D25"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    );
  }
  const shown = valueText ?? (Number.isFinite(Number(value)) ? Number(value).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '—');
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: w, maxWidth: '100%' }}>
        <svg viewBox={`0 0 ${w} ${h + 6}`} width="100%" role="img" aria-label={`${typeof label === 'string' ? label + ': ' : ''}${shown}${suffix || ''} dari ${max}`}>
          <path d={arc} fill="none" stroke="#E7ECF0" strokeWidth={thickness} strokeLinecap="round" />
          <path
            d={arc}
            fill="none"
            stroke={STROKE[color] || color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${len} ${len}`}
            strokeDashoffset={len * (1 - pct)}
            style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }}
            opacity={pct === 0 ? 0 : 1}
          />
          {markerEl}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-[26px] sm:text-[40px] font-semibold leading-none tracking-tightest tabular-nums text-obsidian">
            {shown}
            {suffix && <span className="ml-0.5 text-xl font-medium text-mist-500">{suffix}</span>}
          </span>
          {label && <span className="mt-1.5 text-sm text-mist-700">{label}</span>}
        </div>
      </div>
      {children && <div className="mt-5 w-full">{children}</div>}
    </div>
  );
}

export default Gauge;
