import 'server-only';
import { cache } from 'react';
import { SITE_DEFAULTS, mergeSite } from '@/lib/site-defaults';

const API = process.env.API_URL || 'http://localhost:8080';

/** Objek site mentah dari API (GET /api/site). Gagal/timeout → {} (konten bawaan). Di-cache per request. */
export const getSiteRaw = cache(async () => {
  try {
    const res = await fetch(`${API}/api/site`, { cache: 'no-store', signal: AbortSignal.timeout(2000) });
    if (!res.ok) return {};
    const json = await res.json();
    const site = json?.data?.site ?? json?.site;
    return site && typeof site === 'object' && !Array.isArray(site) ? site : {};
  } catch {
    return {};
  }
});

/** Site lengkap (default + data tersimpan). */
export const getSite = cache(async () => mergeSite(SITE_DEFAULTS, await getSiteRaw()));

/** Testimoni publik untuk SSR (GET /api/testimonials). Gagal → kosong. */
export const getTestimonials = cache(async () => {
  try {
    const res = await fetch(`${API}/api/testimonials`, { cache: 'no-store', signal: AbortSignal.timeout(2000) });
    if (!res.ok) return { items: [], average: 0, total: 0 };
    const d = (await res.json())?.data || {};
    return { items: Array.isArray(d.items) ? d.items : [], average: Number(d.average) || 0, total: Number(d.total) || 0 };
  } catch {
    return { items: [], average: 0, total: 0 };
  }
});
