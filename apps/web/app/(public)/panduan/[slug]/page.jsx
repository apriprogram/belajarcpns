import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Timer } from 'lucide-react';
import { JsonLd } from '@/components/seo/JsonLd';
import { Callout } from '@/components/panduan/blocks';
import {
  ArticleBody,
  ArticleCta,
  ArticleFaq,
  ArticleIntro,
  ArticleMeta,
  ArticleSources,
  Breadcrumbs,
  RelatedArticles,
  TocAside,
  TocInline,
} from '@/components/panduan/ArticleParts';
import { getSite } from '@/lib/site-server';
import { absoluteUrl } from '@/lib/seo';
import { ARTICLES, getArticleMeta, loadArticle } from '@/lib/panduan';
import { readMinutes, wordCount } from '@/lib/panduan/text';
import { articleOgImagePath, breadcrumbNode, faqNode, organizationNode } from '@/lib/panduan/schema';

// Slug statis dari registry; isi halaman tetap dirender per request (brand & URL dari Atur Website).
export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const meta = getArticleMeta(slug);
  // notFound() di metadata → status 404 sungguhan (metadata diselesaikan sebelum respons untuk crawler).
  if (!meta) notFound();
  const site = await getSite();
  const path = `/panduan/${slug}`;
  const title = meta.metaTitle || meta.title;
  return {
    title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: { canonical: path },
    authors: [{ name: site.brand.name, url: absoluteUrl(site, '/') }],
    // Tanpa `images`: gambar dari ./opengraph-image.jsx dipakai otomatis.
    openGraph: {
      type: 'article',
      locale: 'id_ID',
      siteName: site.brand.name,
      url: path,
      title,
      description: meta.description,
      publishedTime: meta.datePublished,
      modifiedTime: meta.dateModified || meta.datePublished,
      section: meta.category,
      tags: meta.keywords,
    },
    twitter: { card: 'summary_large_image', title, description: meta.description },
  };
}

function articleGraph(site, meta, body) {
  const path = `/panduan/${meta.slug}`;
  const url = absoluteUrl(site, path);
  const org = organizationNode(site);
  const graph = [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: meta.title,
      description: meta.description,
      datePublished: meta.datePublished,
      dateModified: meta.dateModified || meta.datePublished,
      inLanguage: 'id-ID',
      author: org,
      publisher: org,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      image: absoluteUrl(site, articleOgImagePath(meta.slug)),
      articleSection: meta.category,
      keywords: (meta.keywords || []).join(', '),
      isAccessibleForFree: true,
      ...(body ? { wordCount: wordCount(body) } : {}),
    },
    breadcrumbNode(
      site,
      [
        { name: 'Beranda', path: '/' },
        { name: 'Panduan', path: '/panduan' },
        { name: meta.title, path },
      ],
      `${url}#breadcrumb`,
    ),
  ];
  const faq = faqNode(body?.faq, url);
  if (faq) graph.push(faq);
  return { '@context': 'https://schema.org', '@graph': graph };
}

export default async function PanduanArticlePage({ params }) {
  const { slug } = await params;
  const meta = getArticleMeta(slug);
  if (!meta) notFound();
  const [site, body] = await Promise.all([getSite(), loadArticle(slug)]);
  const brand = site.brand.name;
  const minutes = body ? readMinutes(body, meta.readMinutes) : meta.readMinutes;

  return (
    <>
      <JsonLd data={articleGraph(site, meta, body)} />
      <div className="container-wide pb-20 pt-6 lg:pb-28 lg:pt-10">
        <div className="mx-auto max-w-[1200px]">
          <Breadcrumbs items={[{ label: 'Beranda', href: '/' }, { label: 'Panduan', href: '/panduan' }, { label: meta.title }]} />

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-10 xl:gap-12">
            <article className="min-w-0 rounded-[24px] bg-white px-5 py-8 ring-1 ring-inset ring-mist-100 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
              <div className="mx-auto max-w-[720px]">
                <header>
                  <ArticleMeta category={meta.category} dateModified={meta.dateModified || meta.datePublished} minutes={minutes} />
                  <h1 className="mt-5 text-[32px] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[44px]">{meta.title}</h1>
                  {!body && <p className="mt-4 text-lg leading-relaxed text-mist-700">{meta.description}</p>}
                </header>

                {body ? (
                  <>
                    <div className="mt-8">
                      <ArticleIntro text={body.intro} />
                    </div>
                    <TocInline body={body} className="mt-5 lg:hidden" />
                    <ArticleBody body={body} />
                    <ArticleFaq items={body.faq} />
                    <ArticleSources items={body.sources} brand={brand} />
                  </>
                ) : (
                  <Callout tone="info" title="Panduan ini segera hadir" text="Isi lengkap sedang disiapkan. Sementara itu, kamu bisa membaca [panduan lainnya](/panduan) atau langsung berlatih soal SKD." />
                )}

                <ArticleCta currentSlug={slug} className="mt-12" />
              </div>
            </article>

            <aside className="hidden lg:block" aria-label="Navigasi artikel">
              <div className="sticky top-24 space-y-4">
                {body && <TocAside body={body} />}
                <div className="rounded-[24px] bg-white p-5 ring-1 ring-inset ring-mist-100">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ghost ring-1 ring-inset ring-mist-100">
                    <Timer className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
                  </span>
                  <p className="mt-4 text-[15px] font-semibold leading-snug">Ukur kemampuanmu</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-mist-700">Tryout SKD 110 soal · 100 menit, gratis.</p>
                  <Link href="/daftar" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cobalt transition-colors hover:text-cobalt-700">
                    Mulai gratis
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </aside>
          </div>

          <RelatedArticles slug={slug} />
        </div>
      </div>
    </>
  );
}
