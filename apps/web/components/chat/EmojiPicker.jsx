'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { EMOJI_GROUPS } from './emoji';

/**
 * Pemilih emoji GroupChat (tab kategori + grid). Dipakai komposer & reaksi lengkap.
 * onPick(emoji) · label (aria) · selected: emoji yang sedang dipilih (disorot) · header: elemen opsional di atas tab
 * autoFocus: fokus ke emoji pertama saat dibuka (pemilih reaksi)
 */
export function EmojiPicker({ onPick, label = 'Pilih emoji', selected, header, className, autoFocus = false }) {
  const [tab, setTab] = useState(EMOJI_GROUPS[0].id);
  const gridRef = useRef(null);
  useEffect(() => {
    if (autoFocus) gridRef.current?.querySelector('button')?.focus({ preventScroll: true });
  }, [autoFocus]);
  const group = EMOJI_GROUPS.find((g) => g.id === tab) || EMOJI_GROUPS[0];
  return (
    <div className={cn('animate-scale-in overflow-hidden rounded-2xl bg-white shadow-float ring-1 ring-mist-100', className)} role="dialog" aria-label={label}>
      {header}
      <div className="flex gap-1 border-b border-mist-100 p-1.5" role="tablist" aria-label="Kategori emoji">
        {EMOJI_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            role="tab"
            aria-selected={tab === g.id}
            title={g.label}
            aria-label={g.label}
            onClick={() => setTab(g.id)}
            className={cn('flex h-8 flex-1 items-center justify-center rounded-lg text-lg transition-colors', tab === g.id ? 'bg-ghost' : 'hover:bg-mist-50')}
          >
            {g.icon}
          </button>
        ))}
      </div>
      <div ref={gridRef} className="grid max-h-48 grid-cols-8 gap-0.5 overflow-y-auto p-2" role="tabpanel" aria-label={group.label}>
        {group.items.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onPick(e)}
            aria-label={e}
            aria-pressed={selected ? selected === e : undefined}
            className={cn('flex h-9 items-center justify-center rounded-lg text-xl transition-transform hover:scale-125 hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt', selected === e && 'bg-cobalt-50 ring-1 ring-cobalt/40')}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmojiPicker;
