'use client';

import { BrandName } from './Logo';
import { useCallback, useEffect, useState } from 'react';
import { Bell, Megaphone } from 'lucide-react';
import { api } from '@/lib/api';
import { excerpt, formatRelatif } from '@/lib/format';
import { Dropdown, IconButton, Spinner } from '@/components/ui';

const SEEN_KEY = 'bisapns:announcements-seen';

/** Tombol bulat notifikasi → daftar pengumuman terbit (GET /api/announcements). */
export function NotificationBell({ variant = 'white' }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);
  const [unread, setUnread] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(false);
      const data = await api.get('/announcements');
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      let seen = 0;
      try {
        seen = Number(localStorage.getItem(SEEN_KEY) || 0);
      } catch {}
      setUnread(list.some((a) => new Date(a.created_at).getTime() > seen));
    } catch {
      setError(true);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onOpenChange = (open) => {
    if (open) {
      setUnread(false);
      try {
        localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {}
    }
  };

  return (
    <Dropdown
      width={340}
      onOpenChange={onOpenChange}
      trigger={
        <IconButton
          icon={<Bell strokeWidth={1.75} />}
          label="Pengumuman"
          variant={variant}
          dot={unread}
          className={variant === 'white' ? '!h-11 !w-11 !shadow-none' : undefined}
        />
      }
    >
      <div className="mb-1 border-b border-mist-100 px-3 pb-2.5 pt-2">
        <p className="text-sm font-semibold">Pengumuman</p>
        <p className="text-xs text-mist-700">Info terbaru dari tim <BrandName /></p>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {items === null && (
          <div className="flex justify-center py-8">
            <Spinner tone="cobalt" />
          </div>
        )}
        {items && items.length === 0 && (
          <div className="flex flex-col items-center px-4 py-8 text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ghost text-obsidian-600">
              <Megaphone className="h-[18px] w-[18px]" />
            </span>
            <p className="text-sm font-medium">{error ? 'Gagal memuat pengumuman' : 'Belum ada pengumuman'}</p>
          </div>
        )}
        {items &&
          items.slice(0, 8).map((a) => (
            <div key={a.id} className="rounded-lg px-3 py-2.5 hover:bg-ghost">
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cobalt" />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-mist-700">{excerpt(a.body, 140)}</p>
                  <p className="mt-1 text-[11px] text-mist-500">{formatRelatif(a.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </Dropdown>
  );
}

export default NotificationBell;
