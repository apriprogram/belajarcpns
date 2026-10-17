'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Tombol "kembali ke atas": muncul setelah menggulir ±1 layar, dengan cincin progres baca.
 * className: atur posisi (default kanan bawah).
 */
export function ScrollToTop({ className }) {
  const [show, setShow] = useState(false);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShow(window.scrollY > window.innerHeight * 0.8);
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const toTop = () => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {}
  };

  const R = 22;
  const C = 2 * Math.PI * R;

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Kembali ke atas"
      title="Kembali ke atas"
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={cn(
        // Mobile: 44px, menghormati safe-area (home indicator iOS / gesture bar Android).
        'group fixed bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] right-[max(1rem,env(safe-area-inset-right))] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white text-obsidian shadow-float ring-1 ring-mist-100 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt sm:bottom-6 sm:right-6 sm:h-12 sm:w-12',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        className,
      )}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r={R} fill="none" stroke="#3765F6" strokeWidth="2" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
      </svg>
      <ArrowUp className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5" />
    </button>
  );
}

export default ScrollToTop;
