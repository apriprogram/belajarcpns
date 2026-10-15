import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, FileText, Gauge, Landmark, PenLine, Timer } from 'lucide-react';
import { cn } from '@/lib/cn';

/*
 * Kartu artikel Panduan. Tanpa hook/state → bisa dipakai di Server Component (hub, artikel terkait)
 * maupun di dalam Client Component (section Panduan di landing).
 * Pola "stretched link": judul adalah tautan, area kartu ikut bisa diklik.
 */

const CATEGORY_ICON = {
  Strategi: Compass,
  'Seleksi CPNS': Landmark,
  Materi: BookOpen,
  Penilaian: Gauge,
  Tryout: Timer,
  Latihan: PenLine,
};

export function CategoryIcon({ category, className }) {
  const Icon = CATEGORY_ICON[category] || FileText;
  return <Icon className={className} strokeWidth={1.9} aria-hidden />;
}

/**
 * article: item ARTICLES · variant: 'default' | 'featured' (latar gelap) · as: tag judul (h2/h3)
 * minutes: menit baca (default article.readMinutes) · eyebrow: label kecil opsional (mis. "Mulai dari sini")
 */
export function ArticleCard({ article, variant = 'default', as: Heading = 'h3', minutes, eyebrow, className }) {
  if (!article) return null;
  const dark = variant === 'featured';
  const mins = minutes || article.readMinutes;
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-[24px] p-6 ring-1 ring-inset transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] focus-within:ring-2 focus-within:ring-cobalt hover:-translate-y-1 sm:p-7',
        dark ? 'bg-obsidian text-white ring-obsidian' : 'bg-white ring-mist-100 hover:shadow-[inset_0_0_0_1px_rgba(55,101,246,.35)]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className={cn('inline-flex min-w-0 items-center gap-2.5 text-[13px] font-medium', dark ? 'text-white/80' : 'text-obsidian-600')}>
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', dark ? 'bg-white/10 text-mint ring-white/10' : 'bg-ghost text-obsidian ring-mist-100')}>
            <CategoryIcon category={article.category} className="h-[18px] w-[18px]" />
          </span>
          <span className="truncate">{article.category}</span>
        </span>
        {mins ? <span className={cn('shrink-0 font-mono text-xs tabular-nums', dark ? 'text-white/60' : 'text-mist-700')}>{mins} mnt baca</span> : null}
      </div>
      {eyebrow && <p className={cn('mt-6 text-xs font-semibold uppercase tracking-[0.08em]', dark ? 'text-mint' : 'text-cobalt')}>{eyebrow}</p>}
      <Heading className={cn('font-semibold leading-snug tracking-[-0.02em]', eyebrow ? 'mt-2' : 'mt-6', dark ? 'text-2xl text-white sm:text-[28px] sm:leading-tight' : 'text-xl')}>
        <Link href={`/panduan/${article.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-[24px] after:content-['']">
          {article.title}
        </Link>
      </Heading>
      <p className={cn('mt-3 text-[15px] leading-relaxed', dark ? 'max-w-xl text-white/65' : 'line-clamp-3 text-mist-700')}>{article.description}</p>
      <span className={cn('mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold transition-colors', dark ? 'text-mint' : 'text-obsidian group-hover:text-cobalt')} aria-hidden>
        Baca panduan
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </article>
  );
}

export default ArticleCard;
