'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Konstanta & utilitas khusus panel admin. */

export const SUBTESTS = ['TWK', 'TIU', 'TKP'];
export const SUBTEST_NAME = { TWK: 'Wawasan Kebangsaan', TIU: 'Intelegensia Umum', TKP: 'Karakteristik Pribadi' };
export const SUBTEST_HEX = { TWK: '#3765F6', TIU: '#F5B301', TKP: '#14833A' };
export const SUBTEST_BG = { TWK: 'bg-cobalt', TIU: 'bg-warning', TKP: 'bg-mint-700' };
export const SUBTEST_MAX = { TWK: 150, TIU: 175, TKP: 225 };
export const SKD_TARGET = { TWK: 30, TIU: 35, TKP: 45 };

export const DIFFICULTY_OPTIONS = [
  { value: 'mudah', label: 'Mudah' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'sulit', label: 'Sulit' },
];
export const LABELS = ['A', 'B', 'C', 'D', 'E'];

/** Kode singkat dari UUID untuk tampilan (mis. "PKT-88389D"). */
export const shortCode = (id = '', prefix = 'PKT') => `${prefix}-${String(id).replace(/-/g, '').slice(0, 6).toUpperCase()}`;

/** ISO → nilai input datetime-local di zona WIB ("2026-10-13T08:00"). */
export function toLocalInput(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t)?.value || '00';
  const hh = g('hour') === '24' ? '00' : g('hour');
  return `${g('year')}-${g('month')}-${g('day')}T${hh}:${g('minute')}`;
}

/** Peserta dianggap online jika last_seen ≤ 5 menit. */
export const isOnline = (lastSeen) => !!lastSeen && Date.now() - new Date(lastSeen).getTime() <= 5 * 60 * 1000;

/**
 * Hook fetch sederhana dengan state loading/error/data (+meta).
 * fetcher: () => Promise<{data, meta}> | Promise<data>
 */
export function useResource(fetcher, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null, meta: null });
  const ref = useRef(fetcher);
  ref.current = fetcher;
  const seq = useRef(0);
  const load = useCallback(async ({ silent } = {}) => {
    const id = ++seq.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const r = await ref.current();
      if (id !== seq.current) return;
      const isList = r && typeof r === 'object' && 'data' in r && 'meta' in r;
      setState({ loading: false, error: null, data: isList ? r.data : r, meta: isList ? r.meta : null });
    } catch (error) {
      if (id !== seq.current) return;
      setState((s) => ({ ...s, loading: false, error }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => {
    load();
  }, [load]);
  return { ...state, reload: load, setData: (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })) };
}

/** Salin teks ke clipboard (dengan fallback). */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}
