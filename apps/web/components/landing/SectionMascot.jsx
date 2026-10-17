'use client';

/* eslint-disable @next/next/no-img-element -- gambar statis di /public / unggahan admin */
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Maskot kecil di judul section. Saat di-hover / fokus / diketuk, gelembung bicara muncul
 * dan teksnya "diketik" seolah maskot sedang berbicara. Saat diam: gelembung titik-titik kecil.
 *
 * image · say (teks) · side: 'left' | 'right' (arah ekor gelembung; gelembung muncul di sisi lain)
 * tone: 'light' | 'dark' (latar section) · size: kelas lebar gambar
 */
export function SectionMascot({ image, say, side = 'right', tone = 'light', className, size = 'w-[88px] sm:w-[128px] xl:w-[144px]' }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    clearInterval(timer.current);
    if (!open || !say) {
      setTyped('');
      return undefined;
    }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const chars = Array.from(say);
    if (reduce) {
      setTyped(say);
      return undefined;
    }
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setTyped(chars.slice(0, i).join(''));
      if (i >= chars.length) clearInterval(timer.current);
    }, 28);
    return () => clearInterval(timer.current);
  }, [open, say]);

  if (!image) return null;
  const done = Array.from(typed).length >= Array.from(say || '').length;

  return (
    <div
      className={cn('group/mascot relative shrink-0 select-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-4', size, className)}
      tabIndex={say ? 0 : -1}
      role={say ? 'button' : undefined}
      aria-label={say ? `Maskot berkata: ${say}` : undefined}
      aria-expanded={say ? open : undefined}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      {say && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute bottom-[94%] z-30 origin-bottom transition-all duration-300 ease-[cubic-bezier(.2,.8,.2,1)]',
            side === 'right' ? 'right-[30%] origin-bottom-right' : 'left-[30%] origin-bottom-left',
            open ? 'w-max max-w-[min(320px,72vw)] scale-100 opacity-100' : 'scale-90 opacity-100',
          )}
        >
          <span
            className={cn(
              'relative block rounded-2xl px-3.5 py-2 text-[13px] font-semibold leading-snug ring-1 ring-inset',
              side === 'right' ? 'rounded-br-md' : 'rounded-bl-md',
              tone === 'dark' ? 'bg-white text-obsidian ring-white/40' : 'bg-white text-obsidian shadow-float ring-mist-100',
            )}
          >
            {open ? (
              <>
                {typed}
                {!done && <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-cobalt" />}
              </>
            ) : (
              <span className="flex items-center gap-1 py-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cobalt [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cobalt [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cobalt" />
              </span>
            )}
          </span>
        </span>
      )}
      <img
        src={image}
        alt=""
        draggable={false}
        className={cn(
          'mascot-float relative h-auto w-full cursor-pointer transition-transform duration-300 group-hover/mascot:scale-105 group-focus-visible/mascot:scale-105',
          tone === 'dark' ? 'drop-shadow-[0_16px_22px_rgba(0,0,0,0.35)]' : 'drop-shadow-[0_14px_18px_rgba(24,29,37,0.16)]',
        )}
      />
    </div>
  );
}

export default SectionMascot;
