import { getSite } from '@/lib/site-server';
import { getArticleMeta } from '@/lib/panduan';
import { renderArticleOgImage } from '@/lib/og-image';

/*
 * og:image per artikel panduan (dimiliki infrastruktur SEO, bukan halaman artikel).
 * URL: /panduan/<slug>/opengraph-image/og — alt = judul artikel. Halaman artikel cukup TIDAK mengisi
 * openGraph.images agar gambar ini dipakai otomatis (lihat docs/SEO.md).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateImageMetadata({ params }) {
  const { slug } = (await params) || {};
  const meta = getArticleMeta(slug);
  return [{ id: 'og', alt: meta ? `${meta.title} — Panduan belajar CPNS` : 'Panduan belajar CPNS', size, contentType }];
}

export default async function ArticleOpenGraphImage({ params }) {
  const { slug } = (await params) || {};
  return renderArticleOgImage(await getSite(), getArticleMeta(slug));
}
