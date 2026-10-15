'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { renderIcon } from './_icon';

/**
 * Segmented control (Semua / Pribadi / Dibagikan): kontainer bg-ghost, item aktif putih.
 * options: [{ value, label, icon, disabled }] atau string[] · value + onChange(value)
 * size: sm (32) | md (36) · fullWidth · ariaLabel. role="radiogroup", navigasi ← → Home End.
 */
export function SegmentedControl({ options = [], value, onChange, size = 'md', fullWidth, ariaLabel = 'Pilihan', className }) {
  const opts = options.map((o) => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) }));
  const refs = useRef([]);
  const enabled = opts.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const activeIdx = opts.findIndex((o) => o.value === value);

  const onKeyDown = (e, idx) => {
    const pos = enabled.indexOf(idx);
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = enabled[(pos + 1) % enabled.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next != null) {
      e.preventDefault();
      refs.current[next]?.focus();
      onChange && onChange(opts[next].value);
    }
  };

  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-ghost p-1 no-scrollbar', fullWidth && 'flex w-full', className)}>
      {opts.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            tabIndex={active || (activeIdx < 0 && i === enabled[0]) ? 0 : -1}
            onClick={() => onChange && onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:cursor-not-allowed disabled:opacity-40',
              size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-9 px-3.5 text-sm',
              fullWidth && 'flex-1',
              active ? 'bg-white text-obsidian ring-1 ring-inset ring-mist-100' : 'text-mist-700 hover:text-obsidian',
            )}
          >
            {renderIcon(o.icon, 'h-4 w-4')}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
