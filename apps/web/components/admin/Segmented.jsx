'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';

/**
 * Kontrol segmented (radiogroup aksesibel, navigasi ← →).
 * Gaya: kontainer bg-ghost p-1 rounded-xl, item aktif putih + ring mist-100.
 * options: [{ value, label, count?, disabled?, activeClass? }] · value · onChange(value)
 * size: sm | md · fullWidth · ariaLabel · invalid
 */
export function Segmented({ options = [], value, onChange, size = 'md', fullWidth, ariaLabel, invalid, className, id }) {
  const refs = useRef([]);
  const onKey = (e, i) => {
    const n = options.length;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
    if (next == null) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange && onChange(options[next].value);
  };
  const activeIdx = options.findIndex((o) => o.value === value);
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      className={cn(
        'inline-flex max-w-full items-center gap-0.5 rounded-xl bg-ghost p-1',
        fullWidth && 'flex w-full',
        invalid && 'ring-2 ring-danger/40',
        className,
      )}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active || (activeIdx === -1 && i === 0) ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange && onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:cursor-not-allowed disabled:opacity-40',
              fullWidth && 'flex-1',
              size === 'sm' ? 'h-8 min-w-8 px-3 text-[13px]' : 'h-9 px-3.5 text-sm',
              active ? o.activeClass || 'bg-white text-obsidian ring-1 ring-inset ring-mist-100' : 'text-mist-700 hover:text-obsidian',
            )}
          >
            {o.label}
            {o.count != null && (
              <span className={cn('rounded-md px-1.5 text-[11px] font-semibold tabular-nums', active ? 'bg-ghost text-obsidian-600' : 'bg-white/70 text-mist-700')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
