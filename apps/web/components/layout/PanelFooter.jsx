'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * Footer ringkas untuk panel peserta & admin: logo + hak cipta di kiri, tautan bantuan di kanan.
 * admin: tautan disesuaikan untuk panel admin.
 */
export function PanelFooter({ admin = false, className }) {
  const year = new Date().getFullYear();
  const links = admin
    ? [
        { label: 'Lihat website', href: '/' },
        { label: 'Atur website', href: '/admin/situs' },
        { label: 'Pengaturan', href: '/admin/pengaturan' },
      ]
    : [
        { label: 'Beranda', href: '/' },
        { label: 'FAQ', href: '/#faq' },
        { label: 'Kirim pesan', href: '/#kontak' },
        { label: 'Profil', href: '/profil' },
      ];
  return (
    <footer className={cn('rounded-[20px] bg-white px-5 py-4 ring-1 ring-inset ring-mist-100 sm:px-6 md:pr-24', className)}>
      <div className="flex flex-col items-center justify-between gap-3 text-[13px] text-mist-700 md:flex-row">
        <a
          href="https://apriprogram.web.id"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-2.5 rounded-md text-center transition-colors hover:text-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt md:text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- logo statis */}
          <img src="/apriprogram.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
          <span>
            © {year} <span className="font-semibold text-obsidian">Apriprogram</span>
          </span>
        </a>
        <nav aria-label="Tautan footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="rounded-md font-medium transition-colors hover:text-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default PanelFooter;
