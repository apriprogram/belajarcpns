'use client';

import { Loader2, Pin, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { KindIcon } from './ChatBubble';
import { snippet } from './chat-utils';

/**
 * Banner pesan tersemat (maks 3) di atas daftar pesan.
 * Klik → gulir ke pesan yang tampil lalu berpindah ke sematan berikutnya ("1/3").
 * Admin dapat melepas sematan lewat tombol ×.
 */
export function PinnedBanner({ pins, index, isAdmin, busy, onOpen, onUnpin }) {
  if (!pins.length) return null;
  const i = Math.min(index, pins.length - 1);
  const p = pins[i];
  const multi = pins.length > 1;
  return (
    <div className="flex items-stretch gap-1 border-b border-mist-100 bg-white pl-3 pr-2">
      <button
        type="button"
        onClick={() => onOpen(p, i)}
        aria-label={`Pesan disematkan${multi ? ` ${i + 1} dari ${pins.length}` : ''} dari ${p.user.name}: ${snippet(p)}. Buka pesan`}
        className="flex min-w-0 flex-1 items-center gap-2.5 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt"
      >
        {multi && (
          <span className="flex h-8 w-[3px] shrink-0 flex-col gap-0.5" aria-hidden>
            {pins.map((x, k) => (
              <span key={x.id} className={cn('w-full flex-1 rounded-full', k === i ? 'bg-cobalt' : 'bg-mist-100')} />
            ))}
          </span>
        )}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cobalt-50 text-cobalt">
          <Pin className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-cobalt-700">
            Pesan disematkan
            {multi && <span className="font-medium tabular-nums text-mist-700">{`${i + 1}/${pins.length}`}</span>}
          </span>
          <span className="flex min-w-0 items-center gap-1 text-xs text-obsidian-600">
            <span className="shrink-0 font-semibold text-obsidian">{p.user.name}:</span>
            {p.kind && p.kind !== 'text' && !p.deleted && <KindIcon kind={p.kind} className="h-3 w-3 shrink-0" />}
            <span className="truncate">{snippet(p)}</span>
          </span>
        </span>
      </button>
      {isAdmin && (
        <button
          type="button"
          onClick={() => onUnpin(p)}
          disabled={busy}
          title="Lepas sematan"
          aria-label={`Lepas sematan pesan ${p.user.name}`}
          className="my-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mist-700 transition-colors hover:bg-ghost hover:text-obsidian disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

export default PinnedBanner;
