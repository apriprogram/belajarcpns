'use client';

import Link from 'next/link';
import { ArrowRight, MessageSquareQuote } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui';
import { useResource } from '@/components/peserta/hooks';
import { StarRating, TESTIMONI_STATUS } from '@/components/testimoni/Stars';

/** Kartu kecil ajakan menulis testimoni; bila sudah ada → tampilkan statusnya. */
export function TestimonialInviteCard() {
  const res = useResource(() => api.get('/me/testimonial'), []);
  if (res.error || (res.loading && !res.data)) {
    return res.error ? null : <div className="h-[92px] animate-pulse rounded-[20px] bg-white ring-1 ring-inset ring-mist-100" aria-hidden />;
  }
  const t = res.data?.testimonial;
  const conf = t ? TESTIMONI_STATUS[t.status] || TESTIMONI_STATUS.pending : null;

  return (
    <Link
      href="/testimoni"
      className="group relative flex items-center gap-3 overflow-hidden rounded-[20px] bg-amber-50 p-4 ring-1 ring-inset ring-amber-300 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white ring-1 ring-inset ring-amber-500" aria-hidden>
        <MessageSquareQuote className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        {t ? (
          <>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-obsidian">Testimoni Anda</span>
              <Badge tone={conf.tone} size="sm">
                {conf.short}
              </Badge>
            </span>
            <span className="mt-1 flex items-center gap-2">
              <StarRating value={t.rating} size="xs" />
              <span className="text-xs font-medium text-amber-800">Lihat / ubah</span>
            </span>
          </>
        ) : (
          <>
            <span className="block text-sm font-semibold text-obsidian">Bagikan pengalaman Anda</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-amber-800">Tulis testimoni singkat — bisa tampil di halaman utama.</span>
          </>
        )}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-amber-600 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export default TestimonialInviteCard;
