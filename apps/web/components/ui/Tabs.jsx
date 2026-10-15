'use client';

import { useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { renderIcon } from './_icon';

/**
 * Tab (role="tablist", navigasi ← → Home End).
 * items: [{ value, label, icon?, count?, disabled? }]
 * value + onChange(value) (terkontrol) atau defaultValue (tak terkontrol)
 * variant: 'pill' (kontainer putih bergaris, aktif obsidian) | 'soft' / 'segmented' (latar ghost, aktif putih)
 *          | 'underline' | 'display' (teks besar ala "Discover | Use Cases": nonaktif abu, aktif obsidian)
 * size: sm | md · fullWidth · idPrefix untuk menautkan panel (aria-controls = `${idPrefix}-panel-${value}`)
 */
export function Tabs({ items = [], value, defaultValue, onChange, variant = 'pill', size = 'md', fullWidth, className, ariaLabel = 'Tab', idPrefix }) {
  const [inner, setInner] = useState(defaultValue ?? (items[0] && items[0].value));
  const current = value !== undefined ? value : inner;
  const refs = useRef([]);
  const autoId = useId();
  const prefix = idPrefix || autoId;

  const select = (v) => {
    if (value === undefined) setInner(v);
    if (onChange) onChange(v);
  };
  const onKeyDown = (e, idx) => {
    const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
    const pos = enabled.indexOf(idx);
    let next = null;
    if (e.key === 'ArrowRight') next = enabled[(pos + 1) % enabled.length];
    else if (e.key === 'ArrowLeft') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next != null) {
      e.preventDefault();
      refs.current[next]?.focus();
      select(items[next].value);
    }
  };

  const v = variant === 'segmented' ? 'soft' : variant;
  const container = {
    pill: 'bg-white p-1 ring-1 ring-inset ring-mist-100 rounded-full gap-0.5',
    soft: 'bg-ghost p-1 rounded-xl gap-0.5',
    underline: 'border-b border-mist-100 gap-6 rounded-none',
    display: 'gap-5 sm:gap-7 rounded-none',
  }[v] || '';

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('no-scrollbar inline-flex max-w-full items-center overflow-x-auto', container, fullWidth && 'flex w-full', className)}>
      {items.map((it, i) => {
        const active = it.value === current;
        return (
          <button
            key={String(it.value)}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            type="button"
            id={`${prefix}-tab-${it.value}`}
            aria-selected={active}
            aria-controls={`${prefix}-panel-${it.value}`}
            tabIndex={active ? 0 : -1}
            disabled={it.disabled}
            onClick={() => select(it.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:cursor-not-allowed disabled:opacity-40',
              fullWidth && 'flex-1',
              v === 'pill' && (size === 'sm' ? 'h-8 rounded-full px-3.5 text-[13px]' : 'h-9 rounded-full px-4 text-sm'),
              v === 'soft' && (size === 'sm' ? 'h-8 rounded-lg px-3 text-[13px]' : 'h-9 rounded-lg px-3.5 text-sm'),
              v === 'pill' && (active ? 'bg-obsidian text-white' : 'text-obsidian-600 hover:bg-ghost hover:text-obsidian'),
              v === 'soft' && (active ? 'bg-white text-obsidian ring-1 ring-inset ring-mist-100' : 'text-mist-700 hover:text-obsidian'),
              v === 'underline' &&
                cn('relative -mb-px h-11 border-b-2 px-0.5 text-sm', active ? 'border-obsidian text-obsidian' : 'border-transparent text-mist-700 hover:text-obsidian'),
              v === 'display' &&
                cn(
                  'rounded-lg font-semibold tracking-[-0.02em]',
                  size === 'sm' ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-[32px] sm:leading-[1.2]',
                  active ? 'text-obsidian' : 'text-mist-500 hover:text-mist-700',
                ),
            )}
          >
            {renderIcon(it.icon, 'h-4 w-4')}
            {it.label}
            {it.count != null && (
              <span
                className={cn(
                  'min-w-[20px] rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                  v === 'display' ? 'self-start text-xs' : '',
                  active && v === 'pill' ? 'bg-white/15 text-white' : active && v === 'soft' ? 'bg-ghost text-obsidian-600' : 'bg-mist-100 text-obsidian-600',
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Panel tab opsional — pasangkan dengan Tabs idPrefix yang sama. */
export function TabPanel({ idPrefix, value, current, className, children }) {
  if (value !== current) return null;
  return (
    <div role="tabpanel" id={`${idPrefix}-panel-${value}`} aria-labelledby={`${idPrefix}-tab-${value}`} className={className}>
      {children}
    </div>
  );
}

export default Tabs;
