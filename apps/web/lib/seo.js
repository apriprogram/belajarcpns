/**
 * Utilitas SEO bersama (server & client). Lihat docs/SEO.md.
 * URL situs: env SITE_URL (deploy) > site.seo.site_url (Atur Website) > default.
 */
export const DEFAULT_SITE_URL = 'https://belajarcpns.web.id';

/** URL dasar tanpa garis miring di akhir. */
export function siteUrl(site) {
  const raw = (typeof process !== 'undefined' && process.env?.SITE_URL) || site?.seo?.site_url || DEFAULT_SITE_URL;
  try {
    const u = new URL(String(raw).trim());
    return `${u.protocol}//${u.host}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Host saja (mis. "belajarcpns.web.id") untuk teks tampilan. */
export function siteHost(site) {
  return siteUrl(site).replace(/^https?:\/\//, '');
}

/** URL absolut untuk path/URL relatif. */
export function absoluteUrl(site, path = '/') {
  if (!path) return siteUrl(site);
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl(site)}${path.startsWith('/') ? '' : '/'}${path}`;
}

/** Judul beranda untuk SEO: seo.title, atau "Nama: Belajar CPNS & Tryout CAT SKD 2027 Gratis". */
export function seoTitle(site) {
  const t = site?.seo?.title?.trim();
  if (t) return t;
  const name = site?.brand?.name || 'BELAJAR CPNS';
  return `${name}: Belajar CPNS & Tryout CAT SKD 2027 Gratis`;
}

export function seoDescription(site) {
  return site?.seo?.description?.trim() || site?.brand?.description || '';
}

/** Nama alternatif brand (untuk schema.org alternateName), tanpa duplikat nama utama. */
export function alternateNames(site) {
  const name = (site?.brand?.name || '').toLowerCase();
  const list = Array.isArray(site?.seo?.alternate_names) ? site.seo.alternate_names : [];
  return [...new Set(list.map((s) => String(s).trim()).filter((s) => s && s.toLowerCase() !== name))];
}

/** Path yang tidak boleh diindeks (panel, ujian, API, auth sensitif). Dipakai robots.js & next.config headers. */
export const PRIVATE_PATHS = ['/admin', '/dashboard', '/latihan', '/tryout', '/ujian', '/hasil', '/riwayat', '/profil', '/testimoni', '/api/', '/reset-password', '/lupa-password', '/design-system'];
