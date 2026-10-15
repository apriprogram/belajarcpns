'use client';

import { Mars, Venus } from 'lucide-react';
import { cn } from '@/lib/cn';

export const GENDERS = [
  { value: 'laki-laki', label: 'Laki-laki', icon: Mars, tone: 'bg-cobalt-50 text-cobalt' },
  { value: 'perempuan', label: 'Perempuan', icon: Venus, tone: 'bg-danger-50 text-danger-700' },
];

export const genderLabel = (g) => GENDERS.find((x) => x.value === g)?.label || '—';

/**
 * Pilihan jenis kelamin (radiogroup 2 kartu). value · onChange(value) · invalid · size: md | lg
 * Dipakai di form daftar & profil.
 */
export function GenderPicker({ value, onChange, invalid, size = 'md', id, name = 'gender', describedBy }) {
  const pick = (v) => onChange && onChange(v);
  const onKey = (e, i) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const next = GENDERS[(i + 1) % GENDERS.length];
    pick(next.value);
    e.currentTarget.parentElement?.querySelectorAll('[role=radio]')[(i + 1) % GENDERS.length]?.focus();
  };
  return (
    <div id={id} role="radiogroup" aria-invalid={invalid || undefined} aria-describedby={describedBy} className="grid grid-cols-2 gap-2">
      {GENDERS.map((g, i) => {
        const on = value === g.value;
        return (
          <button
            key={g.value}
            type="button"
            role="radio"
            name={name}
            aria-checked={on}
            tabIndex={on || (!value && i === 0) ? 0 : -1}
            onClick={() => pick(g.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 text-left text-sm font-medium ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
              size === 'lg' ? 'h-12' : 'h-11',
              on ? 'bg-cobalt-50 text-obsidian ring-cobalt' : invalid ? 'bg-white text-obsidian-600 ring-danger' : 'bg-white text-obsidian-600 ring-mist-100 hover:bg-mist-50',
            )}
          >
            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', g.tone)} aria-hidden>
              <g.icon className="h-4 w-4" strokeWidth={2.25} />
            </span>
            {g.label}
            <span className={cn('ml-auto flex h-4 w-4 items-center justify-center rounded-full ring-1 ring-inset', on ? 'bg-cobalt ring-cobalt' : 'ring-mist')} aria-hidden>
              {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default GenderPicker;
