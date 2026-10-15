/**
 * Potongan JSON-LD (schema.org) untuk halaman Panduan & Tentang. Brand/URL dari `site` (getSite()) saat request.
 * Organization memakai @id yang sama dengan beranda (`<url>/#organization`, app/(public)/page.jsx).
 */
import { absoluteUrl, siteUrl } from '@/lib/seo';
import { toPlain } from './text';

/** Organization (penulis & penerbit). Logo: logo website atau maskot bawaan (sama dengan beranda). */
export function organizationNode(site) {
  const base = siteUrl(site);
  return {
    '@type': 'Organization',
    '@id': `${base}/#organization`,
    name: site?.brand?.name || 'BISA-PNS',
    url: `${base}/`,
    logo: { '@type': 'ImageObject', url: absoluteUrl(site, site?.brand?.logo_url || '/maskot/profil.webp') },
  };
}

/*
 * Path og:image artikel (app/(public)/panduan/[slug]/opengraph-image.jsx, generateImageMetadata id "og").
 * Next 15 memberi akhiran hash pada route gambar metadata di dalam route group: djb2("/(public)/panduan/[slug]")
 * base36 6 karakter → "/panduan/<slug>/opengraph-image-16d1ik/og". Dihitung (bukan ditulis mati) agar ikut
 * berubah bila file dipindah; perbarui OG_SEGMENT bila lokasi file berubah.
 */
const OG_SEGMENT = '/(public)/panduan/[slug]';
const djb2 = (str) => {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) & 0xffffffff;
  return h >>> 0;
};
const OG_SUFFIX = /\/[(@]/.test(OG_SEGMENT) ? `-${djb2(OG_SEGMENT).toString(36).slice(0, 6)}` : '';

export function articleOgImagePath(slug) {
  return `/panduan/${slug}/opengraph-image${OG_SUFFIX}/og`;
}

/** BreadcrumbList dari [{ name, path }] (path relatif → URL absolut). */
export function breadcrumbNode(site, items, id) {
  return {
    '@type': 'BreadcrumbList',
    ...(id ? { '@id': id } : {}),
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(site, it.path),
    })),
  };
}

/** FAQPage dari faq artikel [{ q, a }] (markup inline dibuang). null bila kosong. */
export function faqNode(items, url) {
  const list = (Array.isArray(items) ? items : []).map((f) => ({ q: toPlain(f?.q), a: toPlain(f?.a) })).filter((f) => f.q && f.a);
  if (!list.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    url,
    inLanguage: 'id-ID',
    mainEntity: list.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}
