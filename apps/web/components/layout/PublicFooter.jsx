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
        className="container-wide grid gap-10 py-16 md:[grid-template-columns:var(--footer-cols)]"
        style={{ '--footer-cols': `1.6fr${' 1fr'.repeat(columns.length)}` }}
      >
        <div>
          <Logo />
          {footer.description && <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-700">{footer.description}</p>}
        </div>
        {columns.map((col, i) => (
          <FooterCol key={`${i}-${col.title}`} title={col.title} links={col.links || []} />
        ))}
      </div>
      <div className="border-t border-mist-100">
        <div className="container-wide flex flex-col items-center justify-between gap-2 py-6 text-xs text-mist-700 sm:flex-row">
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
      <ul className="mt-4 space-y-3">
        {links.map((l, i) => (
          <li key={`${i}-${l.href}`}>
            <Link href={l.href || '#'} className="text-sm text-obsidian-600 transition-colors hover:text-obsidian">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PublicFooter;
