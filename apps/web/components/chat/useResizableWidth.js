'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { store } from './chat-utils';

const KEY = 'bisapns:gc-width';
export const GC_MIN_W = 340;
export const GC_DEFAULT_W = 400;
const maxW = () => (typeof window === 'undefined' ? 760 : Math.max(GC_MIN_W, Math.min(760, Math.round(window.innerWidth * 0.6))));
const clamp = (w) => Math.round(Math.min(maxW(), Math.max(GC_MIN_W, w)));

/**
 * Lebar panel GroupChat yang bisa diatur dengan menyeret sisi kiri (desktop).
 * Disimpan di localStorage dan dipublikasikan sebagai CSS var --gc-w di <html>
 * (dipakai padding halaman saat panel di-pin).
 * Mengembalikan { width, dragging, handleProps } — pasang handleProps pada pegangan seret.
 */
export function useResizableWidth() {
  const [width, setWidth] = useState(GC_DEFAULT_W);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef(null);

  useEffect(() => {
    const saved = Number(store.get(KEY));
    if (saved) setWidth(clamp(saved));
    const onResize = () => setWidth((w) => clamp(w));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--gc-w', `${width}px`);
  }, [width]);

  const commit = useCallback((w) => {
    const v = clamp(w);
    setWidth(v);
    store.set(KEY, String(v));
  }, []);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, w: width };
    setDragging(true);
  };
  const onPointerMove = (e) => {
    if (!startRef.current) return;
    // panel menempel di kanan → seret ke kiri = lebih lebar
    setWidth(clamp(startRef.current.w + (startRef.current.x - e.clientX)));
  };
  const end = (e) => {
    if (!startRef.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    startRef.current = null;
    setDragging(false);
    setWidth((w) => {
      store.set(KEY, String(w));
      return w;
    });
  };

  // Selama menyeret: kursor & seleksi teks seragam di seluruh halaman.
  useEffect(() => {
    if (!dragging) return undefined;
    const b = document.body.style;
    const prev = [b.cursor, b.userSelect];
    b.cursor = 'ew-resize';
    b.userSelect = 'none';
    document.documentElement.classList.add('gc-resizing');
    return () => {
      [b.cursor, b.userSelect] = prev;
      document.documentElement.classList.remove('gc-resizing');
    };
  }, [dragging]);

  const handleProps = {
    role: 'separator',
    'aria-orientation': 'vertical',
    'aria-label': 'Ubah lebar GroupChat (seret, atau panah kiri/kanan)',
    'aria-valuemin': GC_MIN_W,
    'aria-valuemax': maxW(),
    'aria-valuenow': width,
    tabIndex: 0,
    title: 'Seret untuk mengubah lebar · klik ganda untuk ukuran awal',
    onPointerDown,
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
    onDoubleClick: () => commit(GC_DEFAULT_W),
    onKeyDown: (e) => {
      const step = e.shiftKey ? 80 : 24;
      if (e.key === 'ArrowLeft') commit(width + step);
      else if (e.key === 'ArrowRight') commit(width - step);
      else if (e.key === 'Home') commit(GC_MIN_W);
      else if (e.key === 'End') commit(maxW());
      else return;
      e.preventDefault();
    },
  };

  return { width, dragging, handleProps };
}
