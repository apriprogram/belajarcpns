'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Heart, Megaphone } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatAngka, formatRelatif } from '@/lib/format';
import { markAnnouncementViewed, setAnnouncementLike } from '@/lib/announcements';
import { BrandName } from './Logo';

const fmtLengkap = (v) => {
  try {
    return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'short' }).format(new Date(v)) + ' WIB';
  } catch {
    return '';
  }
};

/**
 * Tombol hati (suka) pengumuman dengan jumlah suka. Optimistis; dibatalkan bila server gagal.
 * item = { id, liked, likes } · size: 'sm' (kartu/daftar) | 'md' (modal)
 */
export function AnnouncementLike({ item, size = 'sm', className }) {
  const [state, setState] = useState({ liked: !!item?.liked, likes: item?.likes || 0 });
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    setState({ liked: !!item?.liked, likes: item?.likes || 0 });
  }, [item?.id, item?.liked, item?.likes]);

  if (!item?.id) return null;

  const toggle = async (e) => {
    e.stopPropagation();
    if (busy) return;
    const next = !state.liked;
    const prev = state;
    setState({ liked: next, likes: Math.max(0, prev.likes + (next ? 1 : -1)) });
    if (next) {
      setPop(true);
      setTimeout(() => setPop(false), 350);
    }
    setBusy(true);
    try {
      const res = await setAnnouncementLike(item.id, next);
      if (res) setState({ liked: !!res.liked, likes: res.likes ?? 0 });
    } catch {
      setState(prev);
    } finally {
      setBusy(false);
    }
  };

  const md = size === 'md';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={state.liked}
      aria-label={state.liked ? 'Batal suka pengumuman' : 'Suka pengumuman'}
      title={state.liked ? 'Batal suka' : 'Suka'}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
        md ? 'h-10 px-4 text-sm' : 'h-7 px-2.5 text-xs',
        state.liked ? 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger/30' : 'bg-ghost text-obsidian-600 ring-1 ring-inset ring-mist-100 hover:bg-danger-50 hover:text-danger-700',
        className,
      )}
    >
      <Heart className={cn(md ? 'h-[18px] w-[18px]' : 'h-3.5 w-3.5', 'transition-transform duration-300', state.liked && 'fill-danger text-danger', pop && 'scale-125')} aria-hidden />
      <span>{formatAngka(state.likes)}</span>
      {md && <span className="font-medium">{state.liked ? 'Disukai' : 'Suka'}</span>}
    </button>
  );
}

/**
 * Modal detail pengumuman (judul, waktu, isi lengkap). item = { id, title, body, created_at, liked, likes } | null.
 * Membuka modal = peserta "melihat" pengumuman (POST /announcements/:id/view). engage=false (admin) → tanpa hitung & tanpa tombol suka.
 */
export function AnnouncementModal({ item, onClose, engage = true }) {
  useEffect(() => {
    if (engage && item?.id) markAnnouncementViewed(item.id);
  }, [engage, item?.id]);

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      size="md"
      icon={<Megaphone />}
      eyebrow="Pengumuman"
      title={item?.title || ''}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          {engage && <AnnouncementLike item={item} size="md" className="mr-auto" />}
          <Button variant="accent" onClick={onClose} className={engage ? 'flex-1 sm:flex-none' : 'w-full sm:w-auto'}>
            Mengerti
          </Button>
        </div>
      }
    >
      {item && (
        <div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-mist-700">
            <CalendarDays className="h-4 w-4" aria-hidden />
            <span>{fmtLengkap(item.created_at)}</span>
            <span aria-hidden>·</span>
            <span>{formatRelatif(item.created_at)}</span>
          </p>
          <p className="mt-4 whitespace-pre-line break-words text-[15px] leading-relaxed text-obsidian-600">{item.body}</p>
          <p className="mt-5 text-xs text-mist-500">
            Dari tim <BrandName />
          </p>
        </div>
      )}
    </Modal>
  );
}

export default AnnouncementModal;
