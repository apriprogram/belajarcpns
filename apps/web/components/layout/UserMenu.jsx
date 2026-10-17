'use client';

import { ChevronDown, Compass, LayoutDashboard, LogOut, MessageSquareQuote, ShieldCheck, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startTour } from './OnboardingTour';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, Dropdown, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

/** Chip profil: avatar + nama + peran → menu Profil / (Panel admin) / Keluar. */
export function UserMenu({ admin = false, className }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  if (loading && !user) return <Skeleton className="h-11 w-11 sm:w-44" rounded="rounded-full" />;
  const name = user?.name || 'Pengguna';
  const role = user?.role === 'admin' ? 'Admin' : 'Peserta';
  const items = [
    { header: user?.email || 'Akun' },
    admin ? { label: 'Profil saya', icon: <UserRound />, href: '/admin/profil' } : { label: 'Profil saya', icon: <UserRound />, href: '/profil' },
    ...(!admin ? [{ label: 'Tulis testimoni', icon: <MessageSquareQuote />, href: '/testimoni' }] : []),
    ...(!admin ? [{ label: 'Tur dashboard', icon: <Compass />, onClick: () => startTour(router) }] : []),
    ...(admin ? [{ label: 'Dashboard peserta', icon: <LayoutDashboard />, href: '/dashboard' }] : []),
    ...(!admin && user?.role === 'admin' ? [{ label: 'Panel admin', icon: <ShieldCheck />, href: '/admin' }] : []),
    { divider: true },
    { label: 'Keluar', icon: <LogOut />, danger: true, onClick: logout },
  ];
  return (
    <Dropdown
      width={240}
      items={items}
      trigger={
        <button
          type="button"
          className={cn(
            'flex h-11 items-center gap-2.5 rounded-full bg-white p-1 ring-1 max-sm:h-9 max-sm:p-0.5 ring-inset ring-mist-100 transition-colors hover:bg-mist-50 hover:ring-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt sm:pr-3',
            className,
          )}
          aria-label={`Menu akun ${name}`}
        >
          <Avatar name={name} src={user?.avatar_url} size="md" className="[&>img]:!h-9 [&>img]:!w-9 [&>img]:!ring-0 [&>span]:!h-9 [&>span]:!w-9 [&>span]:!ring-0 max-sm:[&>img]:!h-8 max-sm:[&>img]:!w-8 max-sm:[&>span]:!h-8 max-sm:[&>span]:!w-8" />
          <span className="hidden min-w-0 text-left leading-tight sm:block">
            <span className="block max-w-[132px] truncate text-[13px] font-semibold text-obsidian">{name}</span>
            <span className="block text-[11px] font-medium text-mist-700">{role}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 shrink-0 text-mist-700 sm:block" aria-hidden />
        </button>
      }
    />
  );
}

export default UserMenu;
