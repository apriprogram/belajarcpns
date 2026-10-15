'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SITE_DEFAULTS, mergeSite } from '@/lib/site-defaults';

const SiteContext = createContext(SITE_DEFAULTS);
const SiteActionsContext = createContext({ setSite: () => {}, refreshSite: async () => SITE_DEFAULTS });

/**
 * Konten website (branding + halaman utama). `initial` = objek `site` mentah dari server
 * (diambil di app/layout.jsx); selalu digabung di atas SITE_DEFAULTS.
 */
export function SiteProvider({ initial, children }) {
  const [site, setState] = useState(() => mergeSite(SITE_DEFAULTS, initial || {}));

  /** Ganti konten dengan objek site mentah (pratinjau editor / setelah simpan). */
  const setSite = useCallback((raw) => {
    setState(mergeSite(SITE_DEFAULTS, raw || {}));
  }, []);

  /** Ambil ulang dari server (GET /api/site). Gagal → konten tetap. */
  const refreshSite = useCallback(async () => {
    try {
      const res = await fetch('/api/site', { cache: 'no-store' });
      if (!res.ok) return null;
      const json = await res.json();
      // Toleran terhadap pembungkus { success, data: { site } } maupun { site }.
      const raw = json?.data?.site ?? json?.site ?? {};
      const merged = mergeSite(SITE_DEFAULTS, raw);
      setState(merged);
      return merged;
    } catch {
      return null;
    }
  }, []);

  const actions = useMemo(() => ({ setSite, refreshSite }), [setSite, refreshSite]);

  return (
    <SiteActionsContext.Provider value={actions}>
      <SiteContext.Provider value={site}>{children}</SiteContext.Provider>
    </SiteActionsContext.Provider>
  );
}

/** Objek site hasil merge (defaults ← server). Di luar provider → SITE_DEFAULTS. */
export function useSite() {
  return useContext(SiteContext);
}

/** { setSite(rawSite), refreshSite() } */
export function useSiteActions() {
  return useContext(SiteActionsContext);
}

export default SiteProvider;
