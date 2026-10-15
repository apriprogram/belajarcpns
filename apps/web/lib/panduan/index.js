/**
 * Registry artikel "Panduan" (konten SEO). Isi tiap artikel ada di ./articles/<slug>.js (lihat docs/SEO.md → Skema isi artikel).
 * Dipakai: halaman /panduan, /panduan/[slug], sitemap.js, llms.txt, landing (section Panduan).
 */
import { ARTICLES } from './meta';

export { ARTICLES, PANDUAN_PUBLISHED, PANDUAN_SLUGS } from './meta';

export const getArticleMeta = (slug) => ARTICLES.find((a) => a.slug === slug) || null;

/** Isi artikel (skema di docs/SEO.md). null bila belum ada. */
export async function loadArticle(slug) {
  if (!getArticleMeta(slug)) return null;
  try {
    const mod = await import(`./articles/${slug}.js`);
    return mod.default || null;
  } catch {
    return null;
  }
}
