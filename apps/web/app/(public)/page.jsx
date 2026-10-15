import { LandingContent } from '@/components/landing/LandingContent';
import { TestimonialsProvider } from '@/components/landing/TestimonialsContext';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSite, getTestimonials } from '@/lib/site-server';
import { absoluteUrl, alternateNames, seoDescription, seoTitle, siteUrl } from '@/lib/seo';
import { ogImages } from '@/lib/seo-metadata';
import { sectionVisible } from '@/lib/site-defaults';

// Fitur nyata platform (docs/SEO.md → "Fitur platform yang BOLEH disebut").
const FEATURES = [
  'Tryout CBT SKD 110 soal dalam 100 menit, mirip CAT BKN',
  'Timer dihitung server',
  'Jawaban tersimpan otomatis dan bisa dilanjutkan setelah koneksi putus',
  'Tanda ragu-ragu dan panel nomor soal',
  'Latihan soal per sub-materi TWK, TIU, dan TKP dengan pembahasan langsung',
  'Skor per subtes dan status lulus terhadap passing grade',
  'Peringkat peserta',
  'Analisis dan grafik progres belajar',
  'Riwayat ujian',
  'Target belajar harian',
  'Live group chat sesama peserta',
  'Kirim pesan ke admin atau developer',
  'Gratis tanpa iklan',
];

/** Hapus markup inline (**tebal**, [label](url)) dari teks CMS untuk JSON-LD. */
const plain = (s) =>
  String(s || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();

/** Beranda: canonical "/" + og:url; og:image = og_image CMS atau gambar otomatis /opengraph-image. */
export async function generateMetadata() {
  const site = await getSite();
  const title = seoTitle(site);
  const description = seoDescription(site);
  return {
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      siteName: site.brand.name,
      url: '/',
      title,
      description,
      images: ogImages(site, title, '/opengraph-image'),
    },
  };
}

/** Structured data beranda: Organization + WebSite + WebApplication + FAQPage (tanpa rating/review). */
function landingGraph(site) {
  const url = siteUrl(site);
  const home = `${url}/`;
  const { name, description, logo_url: logoUrl } = site.brand;
  const desc = seoDescription(site) || description;
  const alt = alternateNames(site);
  const sameAs = (Array.isArray(site.seo?.same_as) ? site.seo.same_as : []).map((s) => String(s).trim()).filter((s) => /^https?:\/\/\S+$/i.test(s));
  const ids = { org: `${url}/#organization`, site: `${url}/#website`, app: `${url}/#webapp`, faq: `${url}/#faq` };
  const ogImage = absoluteUrl(site, site.seo?.og_image?.trim() || '/opengraph-image');

  const graph = [
    {
      '@type': 'Organization',
      '@id': ids.org,
      name,
      ...(alt.length ? { alternateName: alt } : {}),
      url: home,
      logo: { '@type': 'ImageObject', url: absoluteUrl(site, logoUrl || '/maskot/profil.webp') },
      ...(desc ? { description: desc } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
    {
      '@type': 'WebSite',
      '@id': ids.site,
      name,
      ...(alt.length ? { alternateName: alt } : {}),
      url: home,
      ...(desc ? { description: desc } : {}),
      inLanguage: 'id-ID',
      publisher: { '@id': ids.org },
    },
    {
      '@type': 'WebApplication',
      '@id': ids.app,
      name,
      url: home,
      ...(desc ? { description: desc } : {}),
      applicationCategory: 'EducationalApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Membutuhkan JavaScript dan browser modern (Chrome, Edge, Firefox, atau Safari versi terbaru).',
      inLanguage: 'id-ID',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR', category: 'free' },
      featureList: FEATURES,
      image: ogImage,
      screenshot: absoluteUrl(site, '/landing/shot-dashboard.webp'),
      audience: { '@type': 'EducationalAudience', educationalRole: 'student', audienceType: 'Peserta seleksi CPNS' },
      publisher: { '@id': ids.org },
    },
  ];

  // FAQPage hanya bila section FAQ tampil (isi JSON-LD harus terlihat di halaman).
  const faq = (Array.isArray(site.faq?.items) ? site.faq.items : []).map((it) => ({ q: plain(it?.q), a: plain(it?.a) })).filter((it) => it.q && it.a);
  if (faq.length && sectionVisible(site, 'faq')) {
    graph.push({
      '@type': 'FAQPage',
      '@id': ids.faq,
      url: home,
      inLanguage: 'id-ID',
      isPartOf: { '@id': ids.site },
      mainEntity: faq.map((it) => ({ '@type': 'Question', name: it.q, acceptedAnswer: { '@type': 'Answer', text: it.a } })),
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

export default async function LandingPage() {
  const [site, testimonials] = await Promise.all([getSite(), getTestimonials()]);
  return (
    <>
      <JsonLd data={landingGraph(site)} />
      <TestimonialsProvider initial={testimonials.items.length ? testimonials : null}>
        <LandingContent />
      </TestimonialsProvider>
    </>
  );
}
