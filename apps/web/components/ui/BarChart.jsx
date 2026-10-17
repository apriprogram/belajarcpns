'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { CHART_COLORS, defaultFormat, niceTicks, useElementWidth } from './chart-utils';
import { ChartTooltip } from './LineChart';

/**
 * Bar chart SVG responsif (seri dikelompokkan / grouped) dengan tooltip hover & keyboard (← →).
 *
 * data: [{ label: 'Sen', attempts: 12, registrations: 4 }, ...]
 * xKey (default 'label') · series: [{ key, label, color }] (default satu seri 'value')
 * height (default 240) · formatY · formatValue(v, series)
 * highlightIndex: index batang yang diberi warna penuh, sisanya lebih pudar (opsional)
 */
export function BarChart({
  data = [],
  xKey = 'label',
  series,
  height = 240,
  formatY = defaultFormat,
  formatValue,
  highlightIndex,
  ariaLabel = 'Grafik batang',
  emptyText = 'Belum ada data',
  className,
}) {
  const [wrapRef, width] = useElementWidth();
  const [hover, setHover] = useState(null);
  const ser = useMemo(() => (series && series.length ? series : [{ key: 'value', label: 'Nilai' }]).map((s, i) => ({ ...s, color: s.color || CHART_COLORS[i % CHART_COLORS.length] })), [series]);

  const pad = { top: 16, right: 8, bottom: 30, left: 44 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = Math.max(0, height - pad.top - pad.bottom);
  const n = data.length;

  const ticks = useMemo(() => {
    let mx = 0;
    data.forEach((d) => ser.forEach((s) => (mx = Math.max(mx, Number(d[s.key]) || 0))));
    return niceTicks(0, mx || 1, 5);
  }, [data, ser]);
  const hi = ticks[ticks.length - 1] || 1;

  const band = n ? innerW / n : 0;
  const groupW = Math.min(band * 0.62, 18 * ser.length + 6 * (ser.length - 1) + 12);
  const gap = ser.length > 1 ? Math.min(6, groupW * 0.08) : 0;
  const barW = Math.max(2, (groupW - gap * (ser.length - 1)) / ser.length);
  const yAt = (v) => pad.top + innerH - (Math.max(0, Number(v) || 0) / hi) * innerH;
  const fmtVal = formatValue || ((v) => defaultFormat(v));
  const labelEvery = n > 0 && innerW > 0 ? Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 44)))) : 1;

  const onKey = (e) => {
    if (!n) return;
    if (e.key === 'ArrowRight') setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
    else if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? n) - 1));
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  };

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
            onMouseLeave={() => setHover(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={yAt(t)} y2={yAt(t)} stroke="#C3CED7" strokeOpacity=".7" strokeDasharray={t === 0 ? undefined : '3 5'} />
                <text x={pad.left - 12} y={yAt(t)} textAnchor="end" dominantBaseline="middle" className="fill-mist-700 text-[11px] tabular-nums">
                  {formatY(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const gx = pad.left + band * i + (band - groupW) / 2;
              const isHover = hover === i;
              const dim = (hover != null && !isHover) || (hover == null && highlightIndex != null && highlightIndex !== i);
              return (
                <g key={i} onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
                  <rect x={pad.left + band * i + 2} y={pad.top - 6} width={Math.max(0, band - 4)} height={innerH + 6} rx="12" fill={isHover ? '#F2F3F6' : 'transparent'} />
                  {ser.map((s, si) => {
                    const v = Number(d[s.key]) || 0;
                    const y = yAt(v);
                    const h = Math.max(v > 0 ? 3 : 0, pad.top + innerH - y);
                    const x = gx + si * (barW + gap);
                    const r = Math.min(barW / 2, 8, h);
                    return (
                      <path
                        key={s.key}
                        d={h <= 0 ? '' : `M${x},${pad.top + innerH}V${pad.top + innerH - h + r}Q${x},${pad.top + innerH - h} ${x + r},${pad.top + innerH - h}H${x + barW - r}Q${x + barW},${pad.top + innerH - h} ${x + barW},${pad.top + innerH - h + r}V${pad.top + innerH}Z`}
                        fill={s.color}
                        opacity={dim ? 0.35 : 1}
                        style={{ transition: 'opacity .15s' }}
                      />
                    );
                  })}
                  {/* Label terakhir selalu tampil; label reguler yang terlalu dekat dengannya dilewati agar tidak bertumpuk. */}
                  {(i === n - 1 || (i % labelEvery === 0 && n - 1 - i >= labelEvery)) && (
                    <text x={pad.left + band * i + band / 2} y={height - 8} textAnchor="middle" className={cn('text-[11px]', isHover ? 'fill-obsidian font-semibold' : 'fill-mist-700')}>
                      {d[xKey]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {hover != null && data[hover] && (
            <ChartTooltip
              x={pad.left + band * hover + band / 2}
              y={Math.min(...ser.map((s) => yAt(data[hover][s.key])))}
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

/** Legend sederhana untuk chart. items: [{ label, color }] */
export function ChartLegend({ items = [], className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-mist-700', className)}>
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export default BarChart;
