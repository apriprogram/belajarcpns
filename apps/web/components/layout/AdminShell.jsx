'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  FileStack,
  Globe,
  Inbox,
  LayoutGrid,
  LibraryBig,
  Megaphone,
  Menu as MenuIcon,
  MessageSquareQuote,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings2,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { GroupChat } from '@/components/chat/GroupChat';
import { formatTanggal } from '@/lib/format';
import { IconButton } from '@/components/ui';
import { PanelFooter } from './PanelFooter';
import { Logo, LogoMark } from './Logo';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';

export const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutGrid, exact: true, group: 'Utama' },
  { href: '/admin/soal', label: 'Bank Soal', icon: LibraryBig, group: 'Konten' },
  { href: '/admin/paket', label: 'Paket Ujian', icon: FileStack, group: 'Konten' },
  { href: '/admin/peserta', label: 'Peserta', icon: Users, group: 'Peserta & hasil' },
  { href: '/admin/laporan', label: 'Laporan', icon: BarChart3, group: 'Peserta & hasil' },
  { href: '/admin/testimoni', label: 'Testimoni', icon: MessageSquareQuote, group: 'Peserta & hasil', badge: 'testimonials' },
  { href: '/admin/situs', label: 'Atur Website', icon: Globe, group: 'Sistem' },
  { href: '/admin/chat', label: 'GroupChat', icon: MessagesSquare, group: 'Sistem' },
  { href: '/admin/pesan', label: 'Pesan masuk', icon: Inbox, group: 'Sistem', badge: 'messages' },
  { href: '/admin/pengumuman', label: 'Pengumuman', icon: Megaphone, group: 'Sistem' },
  { href: '/admin/pengaturan', label: 'Pengaturan', icon: Settings2, group: 'Sistem' },
];

const GROUPS = [...new Set(ADMIN_NAV.map((i) => i.group))];
const COLLAPSE_KEY = 'bisapns:admin-sidebar-collapsed';

const isActive = (path, item) => (item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`));

/** Label sub-halaman untuk breadcrumb (mis. /admin/soal/baru → "Tambah soal"). */
function subLabel(path, current) {
  if (!current || path === current.href) return null;
  if (path === '/admin/profil') return 'Profil saya';
  if (path === '/admin/soal/baru') return 'Tambah soal';
  if (path.startsWith('/admin/soal/')) return 'Ubah soal';
  if (path.startsWith('/admin/paket/')) return 'Kelola paket';
  return null;
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt';

/** Sumber badge sidebar: endpoint jumlah, event pembaruan langsung dari halamannya, warna, teks pembaca layar. */
const BADGES = {
  messages: { url: '/admin/messages/unread', event: 'bisapns:messages-unread', bg: 'bg-cobalt', sr: 'belum dibaca' },
  testimonials: { url: '/admin/testimonials/unread', event: 'bisapns:testimonials-unread', bg: 'bg-danger', sr: 'testimoni baru' },
};

/**
 * Jumlah item baru untuk badge sidebar (pesan belum dibaca, testimoni baru): diambil saat pindah halaman
 * & tiap 60 detik, serta diperbarui langsung oleh halamannya lewat event (lihat BADGES).
 */
function useUnreadCount(pathname, key) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const conf = BADGES[key];
    let alive = true;
    const load = () =>
      api
        .get(conf.url)
        .then((r) => alive && setN(r?.unread || 0))
        .catch(() => {});
    load();
    const t = setInterval(load, 60000);
    const onEvt = (e) => setN(Number(e.detail) || 0);
    window.addEventListener(conf.event, onEvt);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener(conf.event, onEvt);
    };
  }, [pathname, key]);
  return n;
}

function SidebarContent({ pathname, collapsed = false, onToggle, onClose, onNavigate }) {
  const unreadMessages = useUnreadCount(pathname, 'messages');
  const unreadTestimonials = useUnreadCount(pathname, 'testimonials');
  const counts = { messages: unreadMessages, testimonials: unreadTestimonials };
  return (
    <div className={cn('flex h-full flex-col rounded-[20px] bg-white ring-1 ring-inset ring-mist-100', collapsed ? 'px-3 py-4' : 'px-3 py-4')}>
      {/* Logo + ciutkan */}
      <div className={cn('flex items-center', collapsed ? 'flex-col gap-3' : 'justify-between gap-2 pl-2')}>
        {collapsed ? (
          <Link href="/admin" aria-label="Dashboard admin" className={cn('rounded-[12px]', focusRing)}>
            <LogoMark />
          </Link>
        ) : (
          <Logo href="/admin" />
        )}
        {onClose ? (
          <IconButton icon={<X />} label="Tutup menu" variant="ghost" size="sm" className="!rounded-xl" onClick={onClose} />
        ) : (
          <IconButton
            icon={collapsed ? <PanelLeftOpen strokeWidth={1.75} /> : <PanelLeftClose strokeWidth={1.75} />}
            label={collapsed ? 'Lebarkan sidebar' : 'Ciutkan sidebar'}
            variant="ghost"
            size="sm"
            className="!rounded-xl text-mist-700"
            aria-expanded={!collapsed}
            onClick={onToggle}
          />
        )}
      </div>

      {/* Aksi utama */}
      <Link
        href="/admin/soal/baru"
        onClick={onNavigate}
        title={collapsed ? 'Tambah soal' : undefined}
        className={cn('group mt-5 flex h-10 items-center gap-3 rounded-xl text-sm font-medium text-obsidian transition-colors hover:bg-ghost', collapsed ? 'justify-center' : 'px-1.5', focusRing)}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cobalt text-white transition-colors group-hover:bg-cobalt-600" aria-hidden>
          <Plus className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <span className={cn(collapsed && 'sr-only')}>Tambah soal</span>
      </Link>

      {/* Navigasi */}
      <nav aria-label="Navigasi admin" className="no-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto">
        {GROUPS.map((g, gi) => (
          <div key={g} className={cn(gi > 0 && 'mt-4 border-t border-mist-100 pt-4')}>
            {!collapsed && <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.08em] text-mist-500">{g}</p>}
            <ul className="space-y-0.5">
              {ADMIN_NAV.filter((i) => i.group === g).map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                const unread = item.badge ? counts[item.badge] || 0 : 0;
                const badge = item.badge ? BADGES[item.badge] : null;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex h-10 items-center gap-3 rounded-xl text-sm transition-colors',
                        collapsed ? 'justify-center' : 'px-3',
                        active ? 'bg-ghost font-semibold text-obsidian' : 'font-medium text-obsidian-600 hover:bg-ghost/70 hover:text-obsidian',
                        focusRing,
                      )}
                    >
                      <span className="relative shrink-0">
                        <Icon className={cn('h-[18px] w-[18px]', active ? 'text-obsidian' : 'text-mist-700')} strokeWidth={1.75} aria-hidden />
                        {unread > 0 && collapsed && <span className={cn('absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-white', badge.bg)} aria-hidden />}
                      </span>
                      <span className={cn('truncate', collapsed && 'sr-only')}>
                        {item.label}
                        {unread > 0 && (
                          <span className="sr-only">
                            , {unread} {badge.sr}
                          </span>
                        )}
                      </span>
                      {unread > 0 && !collapsed && (
                        <span className={cn('ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums text-white', badge.bg)} aria-hidden>
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

    </div>
  );
}

/**
 * Kerangka panel admin (gaya Magnific): latar ghost + gutter 8px, sidebar putih rounded terpisah
 * (dapat diciutkan jadi rail ikon, tersimpan di localStorage), panel konten putih dengan topbar tipis
 * (breadcrumb kiri, aksi kanan). Mobile: sidebar menjadi drawer.
 */
export function AdminShell({ children }) {
  const pathname = usePathname() || '';
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const current = [...ADMIN_NAV].reverse().find((i) => isActive(pathname, i)) || ADMIN_NAV[0];
  const sub = subLabel(pathname, current);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  return (
    <div className="gc-dock-pad min-h-screen bg-ghost lg:flex lg:gap-2 lg:p-2" style={{ '--gc-extra': '8px' }}>
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-obsidian focus:px-4 focus:py-2 focus:text-white">
        Lewati ke konten
      </a>
      {/* Penutup gutter atas agar konten yang digulir tidak tampak di atas topbar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 hidden h-2 bg-ghost lg:block" aria-hidden />

      <aside
        className={cn(
          'sticky top-2 z-30 hidden h-[calc(100vh-16px)] shrink-0 transition-[width] duration-200 ease-out lg:block',
          collapsed ? 'w-[68px]' : 'w-[248px]',
        )}
      >
        <SidebarContent pathname={pathname} collapsed={collapsed} onToggle={toggle} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
          <div className="absolute inset-0 animate-fade-in bg-obsidian/30" onClick={() => setDrawer(false)} aria-hidden />
          <div className="absolute inset-y-2 left-2 w-[272px] max-w-[85vw] animate-slide-in-left rounded-[20px] shadow-float">
            <SidebarContent pathname={pathname} onClose={() => setDrawer(false)} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-white lg:min-h-[calc(100vh-16px)] lg:rounded-[20px] lg:ring-1 lg:ring-inset lg:ring-mist-100">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-mist-100 bg-white/95 px-3 backdrop-blur-xl sm:px-6 lg:top-2 lg:rounded-t-[20px]">
          <div className="flex min-w-0 items-center gap-2">
            <IconButton icon={<MenuIcon />} label="Buka menu" variant="ghost" size="md" className="!rounded-xl lg:hidden" onClick={() => setDrawer(true)} aria-expanded={drawer} />
            <nav aria-label="Breadcrumb" className="min-w-0 text-[13px]">
              <ol className="flex min-w-0 items-center gap-1.5">
                <li className="hidden text-mist-700 sm:block">
                  <Link href="/admin" className={cn('rounded-md hover:text-obsidian', focusRing)}>
                    Admin
                  </Link>
                </li>
                <li className="hidden text-mist sm:block" aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                {sub ? (
                  <>
                    <li className="truncate text-mist-700">
                      <Link href={current.href} className={cn('rounded-md hover:text-obsidian', focusRing)}>
                        {current.label}
                      </Link>
                    </li>
                    <li className="text-mist" aria-hidden>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </li>
                    <li className="truncate font-medium text-obsidian" aria-current="page">
                      {sub}
                    </li>
                  </>
                ) : (
                  <li className="truncate font-medium text-obsidian" aria-current="page">
                    {current.label}
                  </li>
                )}
              </ol>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[13px] text-mist-700 xl:inline-flex">
              <CalendarDays className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {formatTanggal(new Date(), 'long')}
            </span>
            <span className="hidden h-4 w-px bg-mist-100 xl:block" aria-hidden />
            <span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-mint-700 ring-1 ring-inset ring-mint-700/30 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-700" aria-hidden />
              Sistem aktif
            </span>
            <div className="flex items-center gap-1">
              <IconButton
                icon={<Settings2 strokeWidth={1.75} />}
                label="Pengaturan"
                title="Pengaturan"
                variant="ghost"
                size="md"
                href="/admin/pengaturan"
                aria-current={pathname.startsWith('/admin/pengaturan') ? 'page' : undefined}
                className={cn('!rounded-xl', pathname.startsWith('/admin/pengaturan') && '!bg-ghost')}
              />
              <div className="[&_button]:!rounded-xl">
                <NotificationBell variant="ghost" engage={false} />
              </div>
              <UserMenu admin className="!shadow-none ring-1 ring-inset ring-mist-100 [&>span:nth-child(2)]:max-w-[150px]" />
            </div>
          </div>
        </header>
        <main id="konten" className="mx-auto w-full max-w-[1480px] flex-1 px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
          {children}
        </main>
        <div className="mx-auto w-full max-w-[1480px] px-4 pb-4 sm:px-6 lg:px-8">
          <PanelFooter admin />
        </div>
      </div>
      <GroupChat />
    </div>
  );
}

export default AdminShell;
