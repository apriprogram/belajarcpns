'use client';

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { ArticleCard } from '@/components/panduan/ArticleCard';
import { ARTICLES, PANDUAN_PUBLISHED } from '@/lib/panduan';
import { formatDateId } from '@/lib/panduan/text';
import { Reveal } from './Motion';

// Artikel yang ditampilkan di beranda (urutan = urutan kartu). Sisanya ada di /panduan.
const FEATURED = ['cara-jadi-pns', 'belajar-cpns-dari-nol', 'materi-skd-cpns', 'passing-grade-skd', 'contoh-soal-skd', 'tips-lolos-skd'];

/**
 * Isi section "Panduan" di beranda: kartu artikel panduan + tautan ke /panduan.
 * Judul section (SectionHeading) dirender di LandingContent seperti section lain.
 */
export function GuidesSection({ limit = 6 }) {
  const list = FEATURED.map((slug) => ARTICLES.find((a) => a.slug === slug))
    .filter(Boolean)
    .slice(0, limit);
  const updated = [PANDUAN_PUBLISHED, ...ARTICLES.map((a) => a.dateModified || a.datePublished)].filter(Boolean).sort().pop();

  return (
    <div className="mt-8 sm:mt-10 xl:mt-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 xl:gap-6">
        {list.map((a, i) => (
          <Reveal key={a.slug} delay={i * 80} className="h-full">
            <ArticleCard article={a} />
          </Reveal>
        ))}
      </div>
      <Reveal delay={200} className="mt-6 flex flex-col items-stretch justify-between gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-[13px] text-mist-700 sm:text-sm">
          {ARTICLES.length} panduan gratis · diperbarui {formatDateId(updated)}
        </p>
        <Button shape="pill" href="/panduan" variant="secondary" size="lg" iconRight={<ArrowRight />}>
          Lihat semua panduan
        </Button>
      </Reveal>
    </div>
  );
}

export default GuidesSection;
