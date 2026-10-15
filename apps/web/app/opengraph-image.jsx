import { getSite } from '@/lib/site-server';
import { renderHomeOgImage } from '@/lib/og-image';

// Gambar bagikan beranda (og:image). Bila Atur Website → SEO → og_image diisi, layout memakai gambar itu.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const alt = 'Belajar CPNS & Tryout CAT SKD Gratis: 110 soal, 100 menit, dengan pembahasan';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return renderHomeOgImage(await getSite());
}
