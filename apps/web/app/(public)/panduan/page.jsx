import { ArrowRight, ExternalLink } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { Button } from '@/components/ui/Button';
import { SectionMascot } from '@/components/landing/SectionMascot';
import { ArticleCard } from '@/components/panduan/ArticleCard';
import { Breadcrumbs } from '@/components/panduan/ArticleParts';
import { Callout } from '@/components/panduan/blocks';
import { Inline } from '@/components/panduan/Inline';
import { getSite } from '@/lib/site-server';
import { absoluteUrl, siteUrl } from '@/lib/seo';
import { ogImages } from '@/lib/seo-metadata';
import { ARTICLES, PANDUAN_PUBLISHED } from '@/lib/panduan';
import { breadcrumbNode, organizationNode } from '@/lib/panduan/schema';

const TITLE = 'Panduan Belajar CPNS: Materi SKD, Passing Grade & Tips Lolos';
const DESCRIPTION =
  'Panduan belajar CPNS gratis untuk persiapan SKD 2027: cara jadi PNS, materi TWK, TIU, TKP, passing grade, contoh soal dengan pembahasan, tips lolos SKD, dan tryout CAT online.';
const INTRO =
  'Kumpulan **panduan belajar CPNS** gratis untuk persiapan seleksi 2027: mulai dari cara jadi PNS, materi SKD (TWK, TIU, TKP), passing grade dan cara menghitung nilai, contoh soal beserta pembahasan, tips lolos SKD, hingga tryout CAT online. Semua ditulis ringkas, mengacu pada sumber resmi, dan diperbarui saat ada pengumuman baru.';

const OFFICIAL = [
  { label: 'SSCASN BKN', url: 'https://sscasn.bkn.go.id', note: 'Portal pendaftaran resmi' },
  { label: 'BKN', url: 'https://www.bkn.go.id', note: 'Badan Kepegawaian Negara' },
  { label: 'KemenPANRB', url: 'https://www.menpan.go.id', note: 'Regulasi & kebijakan ASN' },
];

const lastModified = () => [PANDUAN_PUBLISHED, ...ARTICLES.map((a) => a.dateModified || a.datePublished)].filter(Boolean).sort().pop();

export async function generateMetadata() {
  const site = await getSite();
  return {
    title: TITLE,
    description: DESCRIPTION,
    keywords: ['belajar cpns', 'panduan cpns', 'materi skd', 'passing grade skd', 'contoh soal skd', 'tips lolos skd', 'cara jadi pns', 'tryout cpns gratis'],
    alternates: { canonical: '/panduan' },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      siteName: site.brand.name,
      url: '/panduan',
      title: TITLE,
      description: DESCRIPTION,
      images: ogImages(site, TITLE, '/opengraph-image'),
    },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
  };
}

function hubGraph(site) {
  const base = siteUrl(site);
  const url = absoluteUrl(site, '/panduan');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name: 'Panduan Belajar CPNS',
        headline: TITLE,
        description: DESCRIPTION,
        inLanguage: 'id-ID',
        dateModified: lastModified(),
        isPartOf: { '@type': 'WebSite', '@id': `${base}/#website`, name: site.brand.name, url: `${base}/` },
        publisher: organizationNode(site),
        breadcrumb: { '@id': `${url}#breadcrumb` },
        mainEntity: { '@id': `${url}#daftar` },
      },
      {
        '@type': 'ItemList',
        '@id': `${url}#daftar`,
        name: 'Daftar panduan belajar CPNS',
        numberOfItems: ARTICLES.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: ARTICLES.map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: absoluteUrl(site, `/panduan/${a.slug}`),
          name: a.title,
        })),
      },
      breadcrumbNode(
        site,
        [
          { name: 'Beranda', path: '/' },
          { name: 'Panduan', path: '/panduan' },
        ],
        `${url}#breadcrumb`,
      ),
    ],
  };
}

export default async function PanduanHubPage() {
  const site = await getSite();
  const [first, ...rest] = ARTICLES;
  const mascot = site.sections?.panduan?.mascot;

  return (
    <>
      <JsonLd data={hubGraph(site)} />
      <div className="container-wide pb-14 pt-4 sm:pb-20 sm:pt-6 lg:pb-28 lg:pt-10">
        <div className="mx-auto max-w-[1200px]">
          <Breadcrumbs items={[{ label: 'Beranda', href: '/' }, { label: 'Panduan' }]} />

          <header className="mt-6 flex items-end justify-between gap-8 sm:mt-8">
            <div className="max-w-3xl">
              <span className="inline-flex h-7 items-center gap-2 rounded-full bg-white pl-1 pr-3 text-xs font-medium text-obsidian-600 ring-1 ring-inset ring-mist-100 sm:h-8 sm:pr-3.5 sm:text-[13px]">
                <span className="flex h-5 items-center rounded-full bg-obsidian px-2 font-mono text-[11px] font-semibold text-white sm:h-6">{String(ARTICLES.length).padStart(2, '0')}</span>
                Panduan CPNS
              </span>
              <h1 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:mt-5 sm:text-[56px] sm:leading-[1.05] sm:tracking-[-0.04em]">Panduan Belajar CPNS</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-mist-700 sm:mt-5 sm:text-lg sm:leading-relaxed">
                <Inline text={INTRO} />
              </p>
            </div>
            {mascot?.image && (
              <div className="hidden shrink-0 pb-2 lg:block">
                <SectionMascot image={mascot.image} say={mascot.say} side="right" />
              </div>
            )}
          </header>

          <Callout
            tone="info"
            flush
            className="mt-6 sm:mt-8"
            title="Status CPNS 2027"
            text="Per Oktober 2026, jadwal dan formasi CPNS 2027 belum diumumkan resmi. Panduan ini memakai acuan seleksi terakhir (CPNS 2024) dan akan diperbarui begitu ada pengumuman dari [SSCASN BKN](https://sscasn.bkn.go.id) atau [KemenPANRB](https://www.menpan.go.id)."
          />

          <section aria-labelledby="semua-panduan" className="mt-8 sm:mt-10">
            <h2 id="semua-panduan" className="sr-only">
              Semua panduan
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {first && <ArticleCard article={first} variant="featured" eyebrow="Mulai dari sini" className="sm:col-span-2" />}
              {rest.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
              <div className="flex flex-col rounded-[24px] bg-mint-50 p-5 ring-1 ring-inset ring-mint-100 sm:col-span-2 sm:p-7 lg:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-mint-700">Gratis · tanpa iklan</p>
                <p className="mt-3 text-lg font-semibold leading-snug tracking-[-0.02em] sm:text-xl sm:leading-snug">Latihan &amp; tryout gratis</p>
                <p className="mt-2.5 text-[15px] leading-relaxed text-obsidian-600">Latihan TWK, TIU, TKP dengan pembahasan, lalu tryout 110 soal dalam 100 menit seperti CAT BKN.</p>
                <div className="mt-auto pt-6">
                  <Button shape="pill" href="/daftar" iconRight={<ArrowRight />} className="max-sm:w-full">
                    Daftar gratis
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="sumber-resmi" className="mt-10 rounded-[24px] bg-white p-5 ring-1 ring-inset ring-mist-100 sm:mt-14 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
              <div className="max-w-md">
                <h2 id="sumber-resmi" className="text-lg font-semibold tracking-[-0.02em] sm:text-xl">
                  Selalu cek sumber resmi
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-mist-700">
                  {site.brand.name} adalah platform latihan mandiri, bukan situs resmi BKN. BKN memperingatkan adanya poster dan tautan pendaftaran palsu, jadi pastikan informasi seleksi hanya dari kanal berikut.
                </p>
              </div>
              <ul className="grid flex-1 gap-2.5 sm:grid-cols-3">
                {OFFICIAL.map((o) => (
                  <li key={o.url}>
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener"
                      className="group flex h-full flex-col rounded-2xl bg-ghost p-4 ring-1 ring-inset ring-mist-100 transition-colors hover:bg-cobalt-50 hover:ring-cobalt-100"
                    >
                      <span className="flex items-center justify-between gap-2 text-[15px] font-semibold text-obsidian">
                        {o.label}
                        <ExternalLink className="h-4 w-4 text-mist-700 transition-colors group-hover:text-cobalt" aria-hidden />
                      </span>
                      <span className="mt-1 text-[13px] text-mist-700">{o.note}</span>
                      <span className="mt-3 font-mono text-[12px] text-cobalt-700">{o.url.replace(/^https:\/\/(www\.)?/, '')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
