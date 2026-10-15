'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const toMin = (t) => {
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const fromMin = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;

/**
 * Daftar slot jam yang bisa di-scroll (gaya referensi "reschedule").
 * value ('HH:mm') + onChange('HH:mm') · start ('07:00') · end ('21:00') · step (menit, 30)
 * times: string[] 'HH:mm' (menggantikan start/end/step) · isTimeDisabled('HH:mm') → bool
 * suffix: teks kecil di kanan jam (mis. 'WIB') · separator ('.' → "08.30") · maxHeight (px, 280)
 * Keyboard: ↑ ↓ Home End, Enter/Spasi memilih. Jam terpilih otomatis di-scroll ke tengah.
 */
export function TimeList({ value, onChange, start = '07:00', end = '21:00', step = 30, times, isTimeDisabled, suffix, separator = '.', maxHeight = 280, ariaLabel = 'Pilih jam', className }) {
  const list = useMemo(() => {
    if (times) return times;
    const out = [];
    for (let t = toMin(start); t <= toMin(end); t += Math.max(5, step)) out.push(fromMin(t));
    return out;
  }, [times, start, end, step]);
  const boxRef = useRef(null);

  // gulir jam terpilih ke tengah tanpa menggulir halaman
  useEffect(() => {
    const box = boxRef.current;
    const el = box?.querySelector('[aria-selected="true"]');
    if (box && el) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2;
  }, [value]);

  const onKeyDown = (e) => {
    const nodes = Array.from(boxRef.current?.querySelectorAll('[role="option"]:not([disabled])') || []);
    const i = nodes.indexOf(document.activeElement);
    let next = null;
    if (e.key === 'ArrowDown') next = nodes[Math.min(nodes.length - 1, i + 1)];
    else if (e.key === 'ArrowUp') next = nodes[Math.max(0, i - 1)];
    else if (e.key === 'Home') next = nodes[0];
    else if (e.key === 'End') next = nodes[nodes.length - 1];
    if (next) {
      e.preventDefault();
      next.focus();
      next.scrollIntoView({ block: 'nearest' });
    }
  };

  const focusIdx = Math.max(0, list.indexOf(value));

  return (
    <div ref={boxRef} role="listbox" aria-label={ariaLabel} onKeyDown={onKeyDown} className={cn('relative space-y-0.5 overflow-y-auto pr-1', className)} style={{ maxHeight }}>
      {list.map((t, i) => {
        const sel = t === value;
        const dis = isTimeDisabled ? !!isTimeDisabled(t) : false;
        return (
          <button
            key={t}
            type="button"
            role="option"
            aria-selected={sel}
            disabled={dis}
            tabIndex={i === focusIdx ? 0 : -1}
            onClick={() => onChange && onChange(t)}
            className={cn(
              'flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt',
              sel ? 'bg-ghost font-semibold text-obsidian' : 'text-mist-700 hover:bg-mist-50 hover:text-obsidian',
              dis && 'cursor-not-allowed text-mist hover:bg-transparent hover:text-mist',
            )}
          >
            <span>{t.replace(':', separator)}</span>
            {suffix && <span className={cn('text-xs', sel ? 'text-obsidian-600' : 'text-mist-500')}>{suffix}</span>}
            {sel && <Check className="ml-auto h-4 w-4 text-cobalt" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

export default TimeList;
