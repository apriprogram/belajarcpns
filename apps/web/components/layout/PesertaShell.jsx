'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpenCheck, CornerDownLeft, History, LayoutGrid, Menu as MenuIcon, MessageSquareQuote, Search, Timer, UserRound, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GroupChat } from '@/components/chat/GroupChat';
import { PanelFooter } from './PanelFooter';
import { Logo } from './Logo';
import { NotificationBell } from './NotificationBell';
import { TraktirKopi } from './TraktirKopi';
import { UserMenu } from './UserMenu';
import { OnboardingTour } from './OnboardingTour';

export const PESERTA_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/latihan', label: 'Latihan', icon: BookOpenCheck },
  { href: '/tryout', label: 'Tryout', icon: Timer, match: ['/tryout', '/hasil'] },
  { href: '/riwayat', label: 'Riwayat', icon: History },
];

/** Tujuan pencarian cepat (⌘K) — hanya rute peserta yang benar-benar ada. */
const QUICK_LINKS = [
  { href: '/dashboard', label: 'Dashboard', desc: 'Ringkasan belajar, jadwal, dan target', icon: LayoutGrid, keywords: 'beranda ringkasan kalender target jadwal' },
  { href: '/latihan', label: 'Latihan soal', desc: 'Latihan TWK, TIU, TKP dengan pembahasan langsung', icon: BookOpenCheck, keywords: 'latihan soal twk tiu tkp belajar pembahasan' },
  { href: '/tryout', label: 'Tryout', desc: 'Daftar paket simulasi CBT', icon: Timer, keywords: 'tryout ujian paket cbt simulasi mulai lanjutkan' },
  { href: '/riwayat', label: 'Riwayat ujian', desc: 'Skor dan hasil tryout sebelumnya', icon: History, keywords: 'riwayat hasil skor nilai ekspor csv' },
  { href: '/profil', label: 'Profil', desc: 'Ubah data diri dan kata sandi', icon: UserRound, keywords: 'profil akun kata sandi password nama nomor hp' },
  { href: '/testimoni', label: 'Tulis testimoni', desc: 'Bagikan pengalaman belajar Anda (bintang + ulasan)', icon: MessageSquareQuote, keywords: 'testimoni ulasan review rating bintang kesan pengalaman' },
];

const isActive = (path, item) => (item.match || [item.href]).some((p) => path === p || path.startsWith(`${p}/`));

/** Kerangka panel peserta: topbar ala dashboard medis (logo, nav pill, cari ⌘K, lonceng, profil). */
export function PesertaShell({ children }) {
  const pathname = usePathname() || '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || ''));
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const kbd = isMac ? '⌘K' : 'Ctrl K';

  return (
    <div className="gc-dock-pad relative min-h-screen bg-ghost">
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-obsidian focus:px-4 focus:py-2 focus:text-white">
        Lewati ke konten
      </a>
      <header className={cn('sticky top-0 z-40 border-b transition-colors duration-200', scrolled ? 'border-mist-100 bg-ghost/85 backdrop-blur-xl' : 'border-transparent bg-ghost')}>
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 sm:h-[76px] sm:gap-3 sm:px-6 lg:px-8">
          <Logo href="/dashboard" className="h-11 shrink-0 !rounded-xl pr-2 max-sm:[&>span:last-child]:hidden" />

          <nav aria-label="Navigasi utama" className="ml-2 hidden items-center gap-2 md:flex">
            {PESERTA_NAV.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-tour={`nav-${item.href.slice(1)}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-ghost',
                    active ? 'bg-cobalt text-white hover:bg-cobalt-600' : 'bg-white text-obsidian-600 ring-1 ring-inset ring-mist-100 hover:text-obsidian hover:ring-mist',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Pencarian cepat: desktop sebagai kolom, mobile sebagai ikon */}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-haspopup="dialog"
              aria-keyshortcuts="Meta+K Control+K"
              data-tour="search"
              className="hidden h-11 w-56 items-center gap-2.5 rounded-full bg-white pl-4 pr-1.5 text-left text-sm text-mist-500 ring-1 ring-inset ring-mist-100 transition-colors hover:ring-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt lg:flex xl:w-64"
            >
              <Search className="h-[18px] w-[18px] shrink-0 text-mist-700" strokeWidth={1.75} aria-hidden />
              <span className="flex-1 truncate">Cari halaman…</span>
              <kbd className="rounded-full bg-ghost px-2.5 py-1 font-sans text-xs font-semibold text-obsidian-600">{kbd}</kbd>
            </button>
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-haspopup="dialog"
              aria-label="Cari halaman"
              title="Cari halaman"
              data-tour="search"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-obsidian ring-1 ring-inset ring-mist-100 transition-colors hover:bg-mist-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt lg:hidden"
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            </button>
            <span data-tour="kopi" className="inline-flex rounded-full">
              <TraktirKopi />
            </span>
            <span data-tour="notif" className="inline-flex rounded-full">
              <NotificationBell />
            </span>
            <span data-tour="profil" className="inline-flex rounded-full">
              <UserMenu />
            </span>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-expanded={mobileOpen}
              aria-controls="menu-mobile"
              data-tour="menu"
              aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-obsidian text-white transition-colors hover:bg-obsidian-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 md:hidden"
            >
              {mobileOpen ? <X className="h-[18px] w-[18px]" aria-hidden /> : <MenuIcon className="h-[18px] w-[18px]" aria-hidden />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav id="menu-mobile" aria-label="Navigasi utama" className="absolute inset-x-4 top-full mt-1 animate-fade-up rounded-2xl bg-white p-1.5 shadow-float ring-1 ring-mist-100 md:hidden">
            {PESERTA_NAV.map((item) => {
              const active = isActive(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-12 items-center gap-3 rounded-xl px-3.5 text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
                    active ? 'bg-cobalt text-white' : 'text-obsidian hover:bg-ghost',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <main id="konten" className="relative mx-auto max-w-[1440px] px-4 pb-8 pt-2 sm:px-6 sm:pt-3 lg:px-8">
        {children}
      </main>
      <div className="mx-auto max-w-[1440px] px-4 pb-6 sm:px-6 lg:px-8">
        <PanelFooter />
      </div>
      <QuickSearch open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <GroupChat />
      {pathname === '/dashboard' && <OnboardingTour />}
    </div>
  );
}

/** Palet pencarian cepat: saring rute peserta, ↑ ↓ pilih, Enter buka, Esc tutup. */
function QuickSearch({ open, onClose }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const restoreRef = useRef(null);
  const listId = useId();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return QUICK_LINKS;
    return QUICK_LINKS.filter((l) => `${l.label} ${l.desc} ${l.keywords}`.toLowerCase().includes(term));
  }, [q]);

  useEffect(() => {
    if (!open) return undefined;
    restoreRef.current = document.activeElement;
    setQ('');
    setActive(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      restoreRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => setActive(0), [q]);

  const go = useCallback(
    (item) => {
      if (!item) return;
      onClose();
      router.push(item.href);
    },
    [onClose, router],
  );

  if (!open || typeof document === 'undefined') return null;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === 'Tab') {
      e.preventDefault(); // fokus tetap di kolom pencarian (dialog modal)
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-obsidian/30" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Pencarian cepat" className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-[24px] bg-white shadow-float ring-1 ring-mist-100">
        <div className="flex items-center gap-3 border-b border-mist-100 px-5">
          <Search className="h-5 w-5 shrink-0 text-mist-700" strokeWidth={1.75} aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            placeholder="Cari halaman, mis. tryout atau profil…"
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-obsidian placeholder:text-mist-500 focus:outline-none"
          />
          <kbd className="hidden rounded-lg bg-ghost px-2 py-1 font-sans text-[11px] font-semibold text-mist-700 sm:inline">Esc</kbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Hasil pencarian" className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-8 text-center text-sm text-mist-700">Tidak ada halaman yang cocok dengan &ldquo;{q}&rdquo;.</li>}
          {results.map((item, i) => {
            const Icon = item.icon;
            const sel = i === active;
            return (
              <li
                key={item.href}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={sel}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(item)}
                className={cn('flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5', sel ? 'bg-ghost' : 'hover:bg-mist-50')}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-obsidian-600 ring-1 ring-inset ring-mist-100">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-obsidian">{item.label}</span>
                  <span className="block truncate text-xs text-mist-700">{item.desc}</span>
                </span>
                {sel && <CornerDownLeft className="h-4 w-4 shrink-0 text-mist-500" aria-hidden />}
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 border-t border-mist-100 px-5 py-2.5 text-[11px] text-mist-700">
          <span>
            <kbd className="font-sans font-semibold text-obsidian-600">↑ ↓</kbd> pilih
          </span>
          <span>
            <kbd className="font-sans font-semibold text-obsidian-600">Enter</kbd> buka
          </span>
          <span>
            <kbd className="font-sans font-semibold text-obsidian-600">Esc</kbd> tutup
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default PesertaShell;
