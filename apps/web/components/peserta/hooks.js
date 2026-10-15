'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Catat waktu belajar: kirim POST /api/me/heartbeat tiap 60 detik AKTIF
 * (hanya saat tab terlihat). Sisa waktu < 60 dtk dikirim saat komponen dilepas (≥ 10 dtk).
 */
export function useHeartbeat(enabled = true) {
  const acc = useRef(0);
  useEffect(() => {
    if (!enabled) return undefined;
    const STEP = 5;
    const send = (seconds) => {
      if (seconds <= 0) return;
      api.post('/me/heartbeat', { seconds: Math.min(120, Math.round(seconds)) }).catch(() => {});
    };
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      acc.current += STEP;
      if (acc.current >= 60) {
        send(60);
        acc.current -= 60;
      }
    }, STEP * 1000);
    return () => {
      clearInterval(id);
      if (acc.current >= 10) send(acc.current);
      acc.current = 0;
    };
  }, [enabled]);
}

/**
 * Muat data dengan state loading/error standar.
 * const { data, loading, error, reload, setData } = useResource(() => api.get('/me/dashboard'), []);
 */
export function useResource(loader, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loaderRef.current();
      setState({ loading: false, error: null, data });
      return data;
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
      return null;
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);

  return { ...state, reload, setData };
}

/** Ambil semua halaman daftar berpaginasi (per_page maks 100). */
export async function fetchAllPages(path, { query = {}, maxPages = 20 } = {}) {
  const out = [];
  let page = 1;
  let total = 1;
  do {
    const { data, meta } = await api.list(path, { query: { ...query, page, per_page: 100 } });
    out.push(...(data || []));
    total = meta?.total_pages || 1;
    page += 1;
  } while (page <= total && page <= maxPages);
  return out;
}
