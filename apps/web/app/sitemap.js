import { getSite } from '@/lib/site-server';
import { absoluteUrl } from '@/lib/seo';
import { ARTICLES, PANDUAN_PUBLISHED } from '@/lib/panduan';

// URL absolut mengikuti SITE_URL / Atur Website → SEO, jadi dibuat per request.
export const dynamic = 'force-dynamic';

const API = process.env.API_URL || 'http://localhost:8080';

/** Waktu terakhir konten beranda diubah di CMS (GET /api/site → updated_at). Gagal → null. */
async function siteUpdatedAt() {
  try {
    const res = await fetch(`${API}/api/site`, { cache: 'no-store', signal: AbortSignal.timeout(2000) });
    if (!res.ok) return null;
    const v = (await res.json())?.data?.updated_at;
    const d = v ? new Date(v) : null;
    return d && !Number.isNaN(d.getTime()) ? d : null;
  } catch {
    return null;
  }
}

const latest = (...dates) =>
  dates
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b - a)[0];

export default async function sitemap() {
  const [site, cmsUpdated] = await Promise.all([getSite(), siteUpdatedAt()]);
  const panduanUpdated = latest(PANDUAN_PUBLISHED, ...ARTICLES.map((a) => a.dateModified || a.datePublished));
  return [
    { url: absoluteUrl(site, '/'), lastModified: latest(cmsUpdated, panduanUpdated), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl(site, '/panduan'), lastModified: panduanUpdated, changeFrequency: 'weekly', priority: 0.9 },
    ...ARTICLES.map((a) => ({
      url: absoluteUrl(site, `/panduan/${a.slug}`),
      lastModified: a.dateModified || a.datePublished || PANDUAN_PUBLISHED,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    { url: absoluteUrl(site, '/tentang'), lastModified: PANDUAN_PUBLISHED, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl(site, '/daftar'), changeFrequency: 'monthly', priority: 0.6 },
  ];
}
