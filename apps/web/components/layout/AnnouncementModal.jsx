'use client';

import { CalendarDays, Megaphone } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { formatRelatif } from '@/lib/format';
import { BrandName } from './Logo';

const fmtLengkap = (v) => {
  try {
    return new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'short' }).format(new Date(v)) + ' WIB';
  } catch {
    return '';
  }
};

/** Modal detail pengumuman (judul, waktu, isi lengkap). item = { title, body, created_at } | null. Latar tanpa blur. */
export function AnnouncementModal({ item, onClose }) {
  return (
    <Modal
      open={!!item}
      onClose={onClose}
      size="md"
      icon={<Megaphone />}
      eyebrow="Pengumuman"
      title={item?.title || ''}
      footer={
        <Button variant="accent" onClick={onClose}>
          Mengerti
        </Button>
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
