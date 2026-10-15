import Link from 'next/link';
import { ArrowRight, CalendarDays, ChevronDown, ChevronRight, Clock3, ExternalLink, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { ARTICLES } from '@/lib/panduan';
import { formatDateId } from '@/lib/panduan/text';
import { Block } from './blocks';
import { Inline } from './Inline';
import { ArticleCard, CategoryIcon } from './ArticleCard';

/* Bagian-bagian halaman artikel & hub Panduan. Semuanya Server Component (tanpa state). */

/** Breadcrumb UI. items: [{ label, href? }] — item terakhir = halaman ini. */
export function Breadcrumbs({ items = [], className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-[13px]', className)}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-mist-700">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${i}-${it.label}`} className="flex min-w-0 items-center gap-1.5">
              {it.href && !last ? (
                <Link href={it.href} className="rounded-md transition-colors hover:text-obsidian">
                  {it.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={cn('truncate', last && 'max-w-[56vw] font-medium text-obsidian sm:max-w-none')}>
                  {it.label}
                </span>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-mist" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Baris meta: kategori · Diperbarui {tanggal} · {n} menit baca. */
export function ArticleMeta({ category, dateModified, minutes, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {category && (
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white pl-1.5 pr-3 text-[13px] font-medium text-obsidian ring-1 ring-inset ring-mist-100">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ghost">
            <CategoryIcon category={category} className="h-3 w-3" />
          </span>
          {category}
        </span>
      )}
      {dateModified && (
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-cobalt-50 px-3 text-[13px] font-medium text-cobalt-700">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Diperbarui <time dateTime={dateModified}>{formatDateId(dateModified)}</time>
        </span>
      )}
      {minutes ? (
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ghost px-3 text-[13px] font-medium text-obsidian-600 ring-1 ring-inset ring-mist-100">
          <Clock3 className="h-3.5 w-3.5" aria-hidden />
          {minutes} menit baca
        </span>
      ) : null}
    </div>
  );
}

/** Daftar isi dari section artikel (+ FAQ & sumber bila ada). */
function tocItems(body) {
  const items = (body?.sections || []).filter((s) => s?.id && s?.title).map((s) => ({ id: s.id, title: s.title }));
  if (body?.faq?.length) items.push({ id: 'faq', title: 'Pertanyaan umum' });
  if (body?.sources?.length) items.push({ id: 'sumber', title: 'Sumber resmi' });
  return items;
}

function TocList({ items }) {
  return (
    <ol className="space-y-0.5">
      {items.map((it, i) => (
        <li key={it.id}>
          <a href={`#${it.id}`} className="flex gap-3 rounded-lg px-2 py-1.5 text-[14px] leading-snug text-obsidian-600 transition-colors hover:bg-ghost hover:text-obsidian">
            <span className="w-5 shrink-0 pt-px font-mono text-[11px] tabular-nums text-mist-500">{String(i + 1).padStart(2, '0')}</span>
            <span>{it.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Daftar isi menempel di samping (desktop). */
export function TocAside({ body }) {
  const items = tocItems(body);
  if (!items.length) return null;
  return (
    <nav aria-label="Daftar isi" className="rounded-[24px] bg-white p-5 ring-1 ring-inset ring-mist-100">
      <p className="eyebrow px-2">Daftar isi</p>
      <div className="mt-3">
        <TocList items={items} />
      </div>
    </nav>
  );
}

/** Daftar isi lipat (mobile/tablet). */
export function TocInline({ body, className }) {
  const items = tocItems(body);
  if (!items.length) return null;
  return (
    <details className={cn('group/toc rounded-2xl bg-ghost ring-1 ring-inset ring-mist-100', className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-[14.5px] font-semibold [&::-webkit-details-marker]:hidden">
        <span>
          Daftar isi <span className="font-normal text-mist-700">· {items.length} bagian</span>
        </span>
        <ChevronDown className="h-4 w-4 text-mist-700 transition-transform duration-200 group-open/toc:rotate-180" aria-hidden />
      </summary>
      <nav aria-label="Daftar isi" className="border-t border-mist-100 px-2 pb-3 pt-2">
        <TocList items={items} />
      </nav>
    </details>
  );
}

/** Ringkasan jawaban di awal artikel (paragraf pembuka yang langsung menjawab kueri). */
export function ArticleIntro({ text }) {
  if (!text) return null;
  return (
    <div className="relative rounded-2xl bg-cobalt-50/60 p-5 ring-1 ring-inset ring-cobalt-100 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cobalt-700">Jawaban singkat</p>
      <p className="mt-2 text-[17px] leading-[1.75] text-obsidian sm:text-lg">
        <Inline text={text} />
      </p>
    </div>
  );
}

/** Isi artikel: section ber-anchor (H2) + blok. */
export function ArticleBody({ body }) {
  let q = 0;
  return (
    <>
      {(body?.sections || []).map((s, si) => (
        <section key={s.id || si} aria-labelledby={s.id ? `${s.id}-title` : undefined} id={s.id} className="scroll-mt-24">
          <h2 id={s.id ? `${s.id}-title` : undefined} className="group mb-4 mt-14 text-[24px] font-semibold leading-tight tracking-[-0.025em] sm:text-[28px]">
            {s.title}
            {s.id && (
              <a href={`#${s.id}`} className="ml-2 inline-block align-middle text-[20px] font-normal text-mist opacity-0 transition-opacity hover:text-cobalt focus-visible:opacity-100 group-hover:opacity-100" aria-label={`Tautan ke bagian: ${s.title}`}>
                #
              </a>
            )}
          </h2>
          {(s.blocks || []).map((b, bi) => (
            <Block key={bi} block={b} number={b?.type === 'question' ? ++q : undefined} />
          ))}
        </section>
      ))}
    </>
  );
}

/** FAQ: accordion <details> (teks tetap di HTML untuk mesin pencari). */
export function ArticleFaq({ items = [], title = 'Pertanyaan yang sering diajukan' }) {
  if (!items.length) return null;
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24">
      <h2 id="faq-title" className="mb-5 mt-14 text-[24px] font-semibold leading-tight tracking-[-0.025em] sm:text-[28px]">
        {title}
      </h2>
      <div className="space-y-2.5">
        {items.map((f, i) => (
          <details key={i} className="group/f rounded-[20px] bg-ghost/70 ring-1 ring-inset ring-transparent transition-colors open:bg-white open:ring-mist-100" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-start gap-4 rounded-[20px] px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
              <span className="pt-1 font-mono text-xs font-semibold text-mist-500 group-open/f:text-cobalt">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="flex-1 text-[15.5px] font-semibold leading-snug sm:text-base">{f.q}</h3>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-obsidian ring-1 ring-inset ring-mist-100 transition-all duration-300 group-open/f:rotate-45 group-open/f:bg-obsidian group-open/f:text-white group-open/f:ring-obsidian">
                <Plus className="h-3.5 w-3.5" aria-hidden />
              </span>
            </summary>
            <p className="pb-5 pl-[52px] pr-6 text-[15.5px] leading-[1.75] text-obsidian-800 sm:pl-[60px]">
              <Inline text={f.a} />
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

const hostOf = (url) => {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
};

/** Sumber resmi + catatan "bukan situs resmi". */
export function ArticleSources({ items = [], brand }) {
  if (!items.length) return null;
  return (
    <section id="sumber" aria-labelledby="sumber-title" className="mt-14 scroll-mt-24 rounded-2xl bg-ghost p-5 ring-1 ring-inset ring-mist-100 sm:p-6">
      <h2 id="sumber-title" className="text-[15px] font-semibold">
        Sumber resmi &amp; rujukan
      </h2>
      <ul className="mt-3 space-y-2">
        {items.map((s, i) => (
          <li key={i}>
            <a href={s.url} target="_blank" rel="noopener" className="group inline-flex items-center gap-2 text-[15px] font-medium text-cobalt hover:text-cobalt-700">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="underline decoration-cobalt/30 underline-offset-[3px] group-hover:decoration-cobalt">{s.label}</span>
              <span className="text-[13px] font-normal text-mist-700">{hostOf(s.url)}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13.5px] leading-relaxed text-mist-700">
        {brand ? `${brand} adalah` : 'Ini adalah'} platform latihan mandiri, <strong className="font-semibold text-obsidian-600">bukan situs resmi BKN</strong>. Jadwal, formasi, dan nilai ambang batas
        selalu mengikuti pengumuman resmi terbaru — cocokkan informasi di sini dengan sumber di atas.
      </p>
    </section>
  );
}

/** Kartu ajakan: latihan & tryout gratis. currentSlug → tombol kedua tidak menaut ke halaman sendiri. */
export function ArticleCta({ currentSlug, className }) {
  const onTryout = currentSlug === 'tryout-cpns-gratis';
  return (
    <aside aria-label="Latihan dan tryout gratis" className={cn('relative overflow-hidden rounded-[24px] bg-obsidian p-6 text-white sm:p-8', className)}>
      <div className="grid-dots-light pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(80%_80%_at_100%_0%,#000,transparent)]" aria-hidden />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-mint">Gratis · tanpa iklan</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-white sm:text-[28px]">Latihan &amp; tryout gratis</p>
        <p className="mt-2.5 max-w-lg text-[15.5px] leading-relaxed text-white/65">
          Latihan soal TWK, TIU, dan TKP dengan pembahasan langsung, lalu tryout 110 soal dalam 100 menit seperti CAT BKN — lengkap dengan skor per subtes dan peringkat.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button shape="pill" href="/daftar" variant="mint" size="lg" iconRight={<ArrowRight />}>
            Daftar gratis
          </Button>
          <Button shape="pill" href={onTryout ? '/panduan/contoh-soal-skd' : '/panduan/tryout-cpns-gratis'} variant="ghost" size="lg" className="text-white ring-1 ring-inset ring-white/15 hover:bg-white/10">
            {onTryout ? 'Coba contoh soal' : 'Lihat cara kerja tryout'}
          </Button>
        </div>
      </div>
    </aside>
  );
}

/** 3 artikel terkait: kategori sama dulu, lalu urutan registry setelah artikel ini. */
export function relatedArticles(slug, n = 3) {
  const idx = ARTICLES.findIndex((a) => a.slug === slug);
  const current = ARTICLES[idx];
  const rest = [...ARTICLES.slice(idx + 1), ...ARTICLES.slice(0, Math.max(0, idx))].filter((a) => a.slug !== slug);
  const same = rest.filter((a) => current && a.category === current.category);
  const others = rest.filter((a) => !same.includes(a));
  return [...same, ...others].slice(0, n);
}

export function RelatedArticles({ slug }) {
  const list = relatedArticles(slug);
  if (!list.length) return null;
  return (
    <section aria-labelledby="terkait-title" className="mt-16 lg:mt-20">
      <div className="flex items-end justify-between gap-4">
        <h2 id="terkait-title" className="text-[26px] font-semibold tracking-[-0.03em] sm:text-[32px]">
          Baca juga
        </h2>
        <Link href="/panduan" className="inline-flex items-center gap-1.5 pb-1 text-sm font-semibold text-obsidian transition-colors hover:text-cobalt">
          Semua panduan
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {list.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}
