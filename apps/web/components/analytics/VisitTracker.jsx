'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const KEY = 'bisapns:visitor';

/** ID pengunjung acak per browser (bukan data pribadi). Disimpan di localStorage; gagal → ID sesi sementara. */
function visitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `s-${Math.random().toString(36).slice(2, 14)}`;
  }
}

/**
 * Catat page view anonim ke POST /api/track setiap pindah halaman (docs/VISITORS.md).
 * Halaman /admin tidak dicatat. Do Not Track dihormati.
 */
export function VisitTracker() {
  const pathname = usePathname() || '/';
  const last = useRef('');
  useEffect(() => {
    if (pathname.startsWith('/admin') || pathname === last.current) return;
    if (typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || window.doNotTrack === '1')) return;
    last.current = pathname;
    const body = JSON.stringify({ visitor_id: visitorId(), path: pathname, referrer: document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : '' });
    try {
      const ok = navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      if (!ok) fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'include' }).catch(() => {});
    } catch {}
  }, [pathname]);
  return null;
}

export default VisitTracker;
