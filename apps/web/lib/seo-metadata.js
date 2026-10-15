/**
 * Helper metadata Next (server) di atas lib/seo.js — dipakai app/layout.jsx dan halaman publik. Lihat docs/SEO.md.
 */

/** Kode verifikasi webmaster: terima kode saja atau tag <meta ... content="..."> utuh yang ditempel admin. */
export function verificationCode(v) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return undefined;
  const m = /content\s*=\s*["']([^"']+)["']/i.exec(s);
  return (m ? m[1] : s).trim() || undefined;
}

/**
 * og:image untuk metadata. Atur Website → SEO → og_image diisi → gambar itu; kosong → gambar otomatis
 * `fallback` (mis. '/opengraph-image'), atau undefined agar file opengraph-image.jsx terdekat dipakai Next.
 * Catatan: bila `openGraph` punya key `images`, Next mengabaikan file opengraph-image di segmen itu.
 */
export function ogImages(site, alt, fallback) {
  const url = typeof site?.seo?.og_image === 'string' ? site.seo.og_image.trim() : '';
  if (url) return [{ url, width: 1200, height: 630, alt }];
  return fallback ? [{ url: fallback, width: 1200, height: 630, alt, type: 'image/png' }] : undefined;
}
