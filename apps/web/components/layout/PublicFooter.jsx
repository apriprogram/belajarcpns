'use client';

import Link from 'next/link';
import { useSite } from '@/components/providers/SiteProvider';
import { Logo } from './Logo';

/** Footer halaman publik (konten dari site.footer). */
export function PublicFooter() {
  const { brand, footer } = useSite();
  const year = new Date().getFullYear();
  const columns = footer.columns || [];
  return (
    <footer className="border-t border-mist-100 bg-white">
      <div
        className="container-wide grid grid-cols-2 gap-x-4 gap-y-8 py-12 sm:grid-cols-1 sm:gap-10 sm:py-16 md:[grid-template-columns:var(--footer-cols)]"
        style={{ '--footer-cols': `1.6fr${' 1fr'.repeat(columns.length)}` }}
      >
        <div className="col-span-2 sm:col-span-1">
          <Logo />
          {footer.description && <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-700">{footer.description}</p>}
        </div>
        {columns.map((col, i) => (
          <FooterCol key={`${i}-${col.title}`} title={col.title} links={col.links || []} />
        ))}
      </div>
      <div className="border-t border-mist-100">
        <div className="container-wide flex flex-col items-center justify-between gap-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-center text-xs text-mist-700 sm:flex-row sm:pb-6 sm:text-left">
          <p>
            © {year} {brand.name}.{footer.copyright ? ` ${footer.copyright}` : ''}
          </p>
          {footer.tagline && <p>{footer.tagline}</p>}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-2 sm:mt-4 sm:space-y-3">
        {links.map((l, i) => (
          <li key={`${i}-${l.href}`}>
            <Link href={l.href || '#'} className="flex min-h-10 items-center text-sm text-obsidian-600 transition-colors hover:text-obsidian sm:inline sm:min-h-0 sm:text-sm">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PublicFooter;
