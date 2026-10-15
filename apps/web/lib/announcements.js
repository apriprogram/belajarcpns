'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

// Interaksi peserta dengan pengumuman: dilihat (buka modal) & suka (ikon hati).
// Perubahan disiarkan lewat event window agar lonceng notifikasi & kartu dashboard tetap sinkron.
const EVENT = 'bisapns:announcement';
const viewed = new Set();

const emit = (detail) => {
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail }));
  } catch {}
};

/** Catat peserta melihat pengumuman (sekali per sesi halaman; server juga menyimpan 1 baris per peserta). */
export function markAnnouncementViewed(id) {
  if (!id || viewed.has(id)) return;
  viewed.add(id);
  api.post(`/announcements/${id}/view`).catch(() => viewed.delete(id));
}

/** Suka / batal suka. Mengembalikan { liked, likes } dari server. */
export async function setAnnouncementLike(id, like) {
  const res = like ? await api.put(`/announcements/${id}/like`) : await api.del(`/announcements/${id}/like`);
  emit({ id, liked: !!res?.liked, likes: res?.likes ?? 0 });
  return res;
}

/** Terapkan perubahan like ke daftar pengumuman lokal (setList = setState untuk array pengumuman). */
export function useAnnouncementSync(setList) {
  useEffect(() => {
    const on = (e) => {
      const { id, liked, likes } = e.detail || {};
      setList((rows) => (Array.isArray(rows) ? rows.map((r) => (r.id === id ? { ...r, liked, likes } : r)) : rows));
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, [setList]);
}
