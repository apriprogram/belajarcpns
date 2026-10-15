'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { CHART_COLORS, defaultFormat, monotonePath, niceTicks, useElementWidth } from './chart-utils';

/**
 * Line chart SVG responsif dengan tooltip hover & navigasi keyboard (← →).
 *
 * data: [{ label: 'Sen', value: 42 }, ...]
 * xKey: kunci label sumbu X (default 'label')
 * series: [{ key: 'value', label: 'Menit', color: '#3765F6' }] (default satu seri 'value')
 * height (px, default 240) · curved (default true) · area (isi lembut di bawah garis seri pertama)
 * formatY(v) label sumbu Y · formatValue(v, series) nilai tooltip
 * defaultActive: index titik yang ditandai saat tidak di-hover (mis. hari ini) · yMin/yMax opsional
 */
export function LineChart({
  data = [],
  xKey = 'label',
  series,
  height = 240,
  curved = true,
  area = true,
  formatY = defaultFormat,
  formatValue,
  defaultActive,
  yMin,
  yMax,
  ariaLabel = 'Grafik garis',
  emptyText = 'Belum ada data',
  className,
}) {
  const [wrapRef, width] = useElementWidth();
  const [hover, setHover] = useState(null);
  const ser = useMemo(() => (series && series.length ? series : [{ key: 'value', label: 'Nilai' }]).map((s, i) => ({ ...s, color: s.color || CHART_COLORS[i % CHART_COLORS.length] })), [series]);

  const pad = { top: 16, right: 16, bottom: 30, left: 44 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = Math.max(0, height - pad.top - pad.bottom);

  const { ticks, lo, hi } = useMemo(() => {
    const vals = [];
    data.forEach((d) => ser.forEach((s) => d[s.key] != null && vals.push(Number(d[s.key]))));
    const mn = yMin ?? Math.min(0, ...(vals.length ? vals : [0]));
    const mx = yMax ?? Math.max(...(vals.length ? vals : [1]));
    const t = niceTicks(mn, mx, 5);
    return { ticks: t, lo: t[0], hi: t[t.length - 1] };
  }, [data, ser, yMin, yMax]);

  const n = data.length;
  const xAt = (i) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v) => pad.top + innerH - ((Number(v) - lo) / (hi - lo || 1)) * innerH;

  const active = hover ?? (defaultActive != null && defaultActive >= 0 && defaultActive < n ? defaultActive : null);
  const fmtVal = formatValue || ((v) => defaultFormat(v));

  const onMove = (e) => {
    if (!n || !innerW) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - pad.left;
    const i = n <= 1 ? 0 : Math.round((x / innerW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const onKey = (e) => {
    if (!n) return;
    if (e.key === 'ArrowRight') setHover((h) => Math.min(n - 1, (h ?? active ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? active ?? n) - 1));
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  };

  const labelEvery = n > 0 && innerW > 0 ? Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 56)))) : 1;

  return (
    <div ref={wrapRef} className={cn('relative w-full select-none', className)} style={{ height }}>
      {width > 0 && n === 0 && <div className="flex h-full items-center justify-center rounded-2xl bg-ghost text-sm text-mist-700">{emptyText}</div>}
      {width > 0 && n > 0 && (
        <>
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={ariaLabel}
            tabIndex={0}
            onKeyDown={onKey}
            onBlur={() => setHover(null)}
            className="overflow-visible rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/30"
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={yAt(t)} y2={yAt(t)} stroke="#C3CED7" strokeOpacity=".7" strokeDasharray="3 5" />
                <text x={pad.left - 12} y={yAt(t)} textAnchor="end" dominantBaseline="middle" className="fill-mist-700 text-[11px] tabular-nums">
                  {formatY(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) =>
              i % labelEvery === 0 || i === n - 1 ? (
                <text
                  key={i}
                  x={xAt(i)}
                  y={height - 8}
                  textAnchor="middle"
                  className={cn('text-[11px]', i === active ? 'fill-obsidian font-semibold' : 'fill-mist-700')}
                >
                  {d[xKey]}
                </text>
              ) : null,
            )}
            {active != null && (
              <line x1={xAt(active)} x2={xAt(active)} y1={pad.top} y2={pad.top + innerH} stroke="#4A5260" strokeOpacity=".5" strokeDasharray="3 4" />
            )}
            {ser.map((s, si) => {
              const pts = data.map((d, i) => (d[s.key] == null ? null : [xAt(i), yAt(d[s.key])])).filter(Boolean);
              if (!pts.length) return null;
              const d = curved ? monotonePath(pts) : `M${pts.map((p) => p.join(',')).join('L')}`;
              return (
                <g key={s.key}>
                  {area && si === 0 && pts.length > 1 && (
                    <path d={`${d}L${pts[pts.length - 1][0]},${pad.top + innerH}L${pts[0][0]},${pad.top + innerH}Z`} fill={s.color} fillOpacity=".06" />
                  )}
                  <path d={d} fill="none" stroke={s.color} strokeWidth={si === 0 ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dashed ? '5 5' : undefined} />
                  {n <= 16 &&
                    data.map((row, i) =>
                      row[s.key] == null || i === active ? null : (
                        <circle key={i} cx={xAt(i)} cy={yAt(row[s.key])} r="4.5" fill="#fff" stroke={s.color} strokeWidth="2" />
                      ),
                    )}
                  {active != null && data[active] && data[active][s.key] != null && (
                    <g>
                      <circle cx={xAt(active)} cy={yAt(data[active][s.key])} r="11" fill={s.color} fillOpacity=".15" />
                      <circle cx={xAt(active)} cy={yAt(data[active][s.key])} r="6" fill="#fff" stroke={s.color} strokeWidth="3" />
                    </g>
                  )}
                </g>
              );
            })}
            <rect
              x={pad.left - 12}
              y={pad.top}
              width={innerW + 24}
              height={innerH}
              fill="transparent"
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
              onTouchStart={(e) => onMove(e.touches[0] ? { currentTarget: e.currentTarget, clientX: e.touches[0].clientX } : e)}
            />
          </svg>
          {hover != null && data[hover] && (
            <ChartTooltip
              x={xAt(hover)}
              y={Math.min(...ser.map((s) => (data[hover][s.key] == null ? Infinity : yAt(data[hover][s.key]))))}
              width={width}
              title={data[hover][xKey]}
              rows={ser.map((s) => ({ color: s.color, label: s.label, value: fmtVal(data[hover][s.key], s) }))}
            />
          )}
        </>
      )}
    </div>
  );
}

/** Tooltip kartu kecil (dipakai Line & Bar chart). */
export function ChartTooltip({ x, y, width, title, rows }) {
  const left = Math.max(70, Math.min(width - 70, x));
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-[120px] -translate-x-1/2 -translate-y-full animate-fade-in rounded-xl bg-obsidian px-3.5 py-2.5 text-white shadow-float"
      style={{ left, top: Math.max(0, (Number.isFinite(y) ? y : 0) - 14) }}
      role="tooltip"
    >
      <p className="mb-1 text-[11px] font-medium text-white/60">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-4 text-[13px]">
          <span className="flex items-center gap-1.5 text-white/80">
            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
            {r.label}
          </span>
          <span className="font-semibold tabular-nums">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export default LineChart;
