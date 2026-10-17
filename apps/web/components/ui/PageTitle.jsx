import { Fragment } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Judul halaman (Style UI v2): breadcrumb kecil abu → judul 28px → deskripsi satu kalimat; aksi di kanan.
 * breadcrumb: [{ label, href }] atau string[] (item terakhir = halaman aktif)
 * title · description · actions · eyebrow · back: { href, label } · meta (chip/badge di bawah deskripsi)
 * size: 'md' (28px) | 'lg' (40px) · as: tag pembungkus ('div') · children: konten di bawah (mis. <Tabs>)
 */
export function PageTitle({ breadcrumb, title, description, actions, eyebrow, back, meta, size = 'md', as: Tag = 'div', className, children }) {
  const crumbs = (breadcrumb || []).map((c) => (typeof c === 'string' ? { label: c } : c));
  return (
    <Tag className={className}>
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-mist-700 transition-colors hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
        >
          <ArrowLeft className="h-4 w-4" />
          {back.label || 'Kembali'}
        </Link>
      )}
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-mist-700 sm:text-[13px]">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <Fragment key={`${c.label}-${i}`}>
                  <li className="min-w-0">
                    {c.href && !last ? (
                      <Link href={c.href} className="rounded-md transition-colors hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current={last ? 'page' : undefined} className={cn(last && 'font-medium text-obsidian-600')}>
                        {c.label}
                      </span>
                    )}
                  </li>
                  {!last && (
                    <li aria-hidden className="text-mist">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h1 className={cn('font-semibold text-obsidian', size === 'lg' ? 'text-[24px] leading-tight tracking-[-0.02em] sm:text-[40px] sm:tracking-[-0.03em]' : 'text-2xl leading-tight tracking-[-0.02em] sm:text-[28px]')}>{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist-700">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-6">{children}</div>}
    </Tag>
  );
}

export default PageTitle;
