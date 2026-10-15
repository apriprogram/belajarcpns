'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/** Pasang callback saat elemen masuk viewport (sekali). */
function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const { threshold = 0.18, rootMargin = '0px 0px -8% 0px' } = options;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);
  return [ref, inView];
}

/**
 * Animasi muncul saat di-scroll.
 * variant: up (default) | scale | left | right | fade · delay (ms) · as (tag)
 */
export function Reveal({ as: Tag = 'div', variant = 'up', delay = 0, className, style, children, ...props }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      data-variant={variant}
      className={cn('reveal', inView && 'is-in', className)}
      style={{ '--d': `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Angka yang menghitung naik saat terlihat. */
export function CountUp({ to, duration = 1400, className }) {
  const [ref, inView] = useInView({ threshold: 0.6 });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(to);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {value}
    </span>
  );
}

/**
 * Efek scroll pada hero: konten sedikit mengecil & memudar saat digulir,
 * latar bergerak lebih lambat (parallax). Menulis CSS var --p (0..1) ke elemen.
 */
export function ScrollProgress({ className, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = el.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      el.style.setProperty('--p', p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className={className} style={{ '--p': 0 }}>
      {children}
    </div>
  );
}

/**
 * Teks yang muncul kata per kata dari balik "masker" saat terlihat.
 * parts: string, atau array { text, className } untuk mewarnai sebagian kalimat.
 * delay (ms) · stagger (ms per kata) · as (tag)
 */
export function SplitText({ as: Tag = 'span', parts, children, delay = 0, stagger = 45, className, ...props }) {
  const [ref, inView] = useInView({ threshold: 0.3, rootMargin: '0px 0px -5% 0px' });
  const segments = parts || [{ text: typeof children === 'string' ? children : '' }];
  let i = 0;
  return (
    <Tag ref={ref} className={cn('split', inView && 'is-in', className)} style={{ '--d': `${delay}ms`, '--s': `${stagger}ms` }} {...props}>
      {(typeof segments === 'string' ? [{ text: segments }] : segments).map((seg, si) =>
        seg.text
          .split(/\s+/)
          .filter(Boolean)
          .map((w, wi) => (
            <Fragment key={`${si}-${wi}`}>
              <span className="split-word">
                <span className={seg.className} style={{ '--i': i++ }}>
                  {w}
                </span>
              </span>{' '}
            </Fragment>
          )),
      )}
    </Tag>
  );
}
