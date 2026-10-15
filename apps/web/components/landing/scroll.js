'use client';

import { useEffect, useState } from 'react';

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// easeInOutQuint: mulai & berhenti halus, cepat di tengah.
const ease = (t) => (t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2);

let cancelCurrent = null;

/**
 * Gulir halus ke section (id) dengan easing sendiri (lebih "berbobot" dari scroll-behavior bawaan).
 * Dibatalkan bila pengguna menggulir sendiri. id 'beranda' = puncak halaman.
 */
export function scrollToSection(id) {
  if (typeof window === 'undefined') return;
  const el = id === 'beranda' ? null : document.getElementById(id);
  if (id !== 'beranda' && !el) return;
  const target = el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 0;
  try {
    window.history.replaceState(null, '', id === 'beranda' ? window.location.pathname : `#${id}`);
  } catch {}

  cancelCurrent?.();
  const start = window.scrollY;
  const dist = target - start;
  if (prefersReduced() || Math.abs(dist) < 2) {
    window.scrollTo(0, target);
    return;
  }
  const duration = Math.min(1100, Math.max(550, Math.abs(dist) * 0.45));
  let raf = 0;
  let t0 = 0;
  const stop = () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
    cancelCurrent = null;
  };
  const step = (now) => {
    if (!t0) t0 = now;
    const p = Math.min(1, (now - t0) / duration);
    window.scrollTo(0, start + dist * ease(p));
    if (p < 1) raf = requestAnimationFrame(step);
    else stop();
  };
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);
  cancelCurrent = stop;
  raf = requestAnimationFrame(step);
}

/**
 * Scroll-spy: indeks section yang sedang melewati garis tengah layar (-1 bila tidak ada).
 * enabled=false → tidak memantau (mis. di luar halaman utama).
 */
export function useActiveSection(ids, enabled = true) {
  const [active, setActive] = useState(-1);
  const key = ids.join('|');
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return undefined;
    const list = key.split('|');
    const els = list.map((id) => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;
    const visible = new Set();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? visible.add(e.target.id) : visible.delete(e.target.id)));
        const idx = list.findIndex((id) => visible.has(id));
        setActive(idx);
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key, enabled]);
  return active;
}
