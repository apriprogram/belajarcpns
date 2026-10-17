'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu as MenuIcon, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth, homeFor } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui';
import { scrollToSection, useActiveSection } from '@/components/landing/scroll';
import { useSite } from '@/components/providers/SiteProvider';
import { sectionVisible } from '@/lib/site-defaults';
import { Logo } from './Logo';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Navbar publik, bersih & ramping (64px): transparan di puncak, jadi kaca putih dengan garis
 * tipis saat digulir. Menu di tengah tanpa kotak — sorotan lembut meluncur mengikuti hover,
 * titik cobalt menandai section aktif (scroll-spy). Klik menu → gulir halus beranimasi.
 */
export function PublicNavbar() {
  const { user } = useAuth();
  const site = useSite();
  const { navbar } = site;
  // Menu dari site.navbar.links, tanpa section yang disembunyikan.
  const links = (navbar.links || []).filter((l) => l?.id && sectionVisible(site, l.id));
  const ids = links.map((l) => l.id);
  const pathname = usePathname();
  const onHome = pathname === '/';
  const active = useActiveSection(ids, onHome);
  const [hover, setHover] = useState(-1);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pill, setPill] = useState({ left: 0, width: 0, visible: false });
  const itemRefs = useRef([]);
  const barRef = useRef(null);

  // Latar & bar progres mengikuti posisi scroll.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 8);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Sorotan hover: hanya tampil saat ada item yang di-hover/fokus. Diukur dari <li> (anak langsung <ul>).
  const measure = useCallback(() => {
    const el = itemRefs.current[hover];
    if (!el || hover < 0) {
      setPill((p) => ({ ...p, visible: false }));
      return;
    }
    setPill({ left: el.offsetLeft, width: el.offsetWidth, visible: true });
  }, [hover]);
  useIsoLayoutEffect(measure, [measure]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const go = (e, id) => {
    setOpen(false);
    if (!onHome) return; // halaman lain: biarkan navigasi biasa ke /#id
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-[background-color,box-shadow] duration-300',
        open ? 'bg-white shadow-[0_1px_0_rgba(24,29,37,.06)]' : scrolled ? 'bg-white/75 shadow-[0_1px_0_rgba(24,29,37,.06)] backdrop-blur-xl backdrop-saturate-150' : 'bg-transparent',
      )}
    >
      <div className="container-wide relative flex h-16 items-center justify-between gap-4">
        <Logo href="/" className="shrink-0" />

        <nav aria-label="Navigasi publik" className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
          <ul className="relative flex items-center gap-1" onMouseLeave={() => setHover(-1)}>
            <span
              aria-hidden
              className="absolute top-1/2 h-9 -translate-y-1/2 rounded-full bg-obsidian/[0.06] transition-[left,width,opacity] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ left: pill.left, width: pill.width, opacity: pill.visible ? 1 : 0 }}
            />
            {links.map((l, i) => (
              <li key={l.id} ref={(el) => (itemRefs.current[i] = el)} className="relative">
                <Link
                  href={`/#${l.id}`}
                  onClick={(e) => go(e, l.id)}
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(-1)}
                  aria-current={active === i ? 'location' : undefined}
                  className={cn(
                    'relative z-10 inline-flex h-9 items-center rounded-full px-3.5 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-none',
                    active === i ? 'text-obsidian' : 'text-obsidian-600 hover:text-obsidian',
                  )}
                >
                  {l.label}
                </Link>
                {/* titik penanda section aktif */}
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-cobalt transition-all duration-300',
                    active === i ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
                  )}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Button shape="pill" href={homeFor(user)} size="md" iconRight={<ArrowRight />} className="max-sm:h-9 max-sm:gap-1.5 max-sm:px-3.5 max-sm:text-[13px] max-sm:after:absolute max-sm:after:inset-x-0 max-sm:after:-inset-y-1">
              {user.role === 'admin' ? 'Panel admin' : 'Dashboard'}
            </Button>
          ) : (
            <>
              <Link href="/login" className="hidden h-10 items-center rounded-full px-4 text-[14px] font-medium text-obsidian-600 transition-colors hover:bg-obsidian/[0.06] hover:text-obsidian sm:inline-flex">
                {navbar.login_label}
              </Link>
              <Button shape="pill" href="/daftar" size="md" iconRight={<ArrowRight />} className="max-sm:h-9 max-sm:gap-1.5 max-sm:px-3.5 max-sm:text-[13px] max-sm:after:absolute max-sm:after:inset-x-0 max-sm:after:-inset-y-1">
                {navbar.cta_label}
              </Button>
            </>
          )}
          <button
            type="button"
            className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-full text-obsidian transition-colors hover:bg-obsidian/[0.06] sm:mr-0 sm:h-10 sm:w-10 lg:hidden"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Menu mobile: overlay di bawah navbar (tidak menggeser layout), membuka dengan animasi tinggi */}
      <div
        className={cn(
          'absolute inset-x-0 top-full grid transition-[grid-template-rows] duration-300 ease-out lg:hidden',
          open ? 'grid-rows-[1fr] border-b border-mist-100 bg-white' : 'grid-rows-[0fr]',
        )}
      >
        <nav aria-label="Navigasi publik" className="overflow-hidden" inert={!open}>
          <ul className="container-wide max-h-[calc(100svh-4rem)] space-y-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 sm:max-h-none sm:overflow-visible sm:pb-4">
            {links.map((l, i) => (
              <li key={l.id} className={cn('transition-all duration-300', open ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')} style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}>
                <Link
                  href={`/#${l.id}`}
                  onClick={(e) => go(e, l.id)}
                  className={cn('flex min-h-12 items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium hover:bg-ghost sm:min-h-0', active === i && 'bg-ghost')}
                >
                  {l.label}
                  <ArrowRight className="h-4 w-4 text-mist-500" />
                </Link>
              </li>
            ))}
            {!user && (
              <li>
                <Link href="/login" onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 py-3 text-[15px] font-semibold text-cobalt hover:bg-ghost sm:block sm:min-h-0">
                  {navbar.login_label}
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Bar progres baca (hanya saat digulir) */}
      <span ref={barRef} aria-hidden className={cn('absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-cobalt transition-opacity duration-300', scrolled ? 'opacity-100' : 'opacity-0')} />
    </header>
  );
}

export default PublicNavbar;
