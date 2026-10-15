'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';
import { sectionVisible } from '@/lib/site-defaults';
import { scrollToSection, useActiveSection } from './scroll';

// Urutan section halaman utama + warna latar masing-masing (berganti halus saat section berganti).
const SECTIONS = [
  { id: 'beranda', label: 'Beranda', bg: '#FFFFFF' },
  { id: 'fitur', label: 'Fitur', bg: '#F2F3F6' },
  { id: 'testimoni', label: 'Testimoni', bg: '#F2F3F6' },
  { id: 'skd', label: 'SKD', bg: '#FFFFFF' },
  { id: 'langkah', label: 'Cara mulai', bg: '#F2F3F6' },
  { id: 'panduan', label: 'Panduan', bg: '#F2F3F6' },
  { id: 'faq', label: 'FAQ', bg: '#FFFFFF' },
  { id: 'kontak', label: 'Kontak', bg: '#F2F3F6' },
];

/**
 * Lapisan transisi antar-section: latar halaman ber-crossfade sesuai section aktif
 * dan indikator titik di kanan (desktop) yang bisa diklik untuk berpindah section.
 */
export function SectionChrome() {
  const site = useSite();
  // Section tersembunyi tidak punya titik; label mengikuti menu navbar bila ada.
  const sections = SECTIONS.filter((s) => sectionVisible(site, s.id)).map((s) => ({
    ...s,
    label: site.navbar.links?.find((l) => l?.id === s.id)?.label || s.label,
  }));
  const raw = useActiveSection(sections.map((s) => s.id));
  const last = useRef(0);
  if (raw >= 0) last.current = raw;
  const active = Math.min(raw >= 0 ? raw : last.current, Math.max(0, sections.length - 1));
  if (!sections.length) return null;

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 transition-colors duration-700 ease-out" style={{ backgroundColor: sections[active].bg }} />

      <nav aria-label="Pindah section" className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 xl:block 2xl:right-6">
        <ul className="flex flex-col items-end gap-1.5">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a
                href={s.id === 'beranda' ? '/' : `#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(s.id);
                }}
                aria-current={active === i ? 'location' : undefined}
                className="group flex h-7 items-center gap-3 rounded-full pl-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
              >
                <span
                  className={cn(
                    'whitespace-nowrap rounded-full bg-obsidian px-2.5 py-1 text-[11px] font-medium text-white transition-all duration-300',
                    'pointer-events-none translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100',
                  )}
                >
                  {s.label}
                </span>
                <span
                  className={cn(
                    'block w-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)]',
                    active === i ? 'h-6 bg-obsidian' : 'h-1.5 bg-mist group-hover:bg-obsidian-600',
                  )}
                />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

export default SectionChrome;
