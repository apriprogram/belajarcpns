'use client';

import { useId, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/cn';

function pagesToShow(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (page >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => set.add(p));
  const arr = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  arr.forEach((p, i) => {
    if (i && p - arr[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

const BTN =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40';
const IDLE = 'bg-white text-obsidian-600 ring-1 ring-inset ring-mist-100 hover:bg-mist-50 hover:text-obsidian';

/**
 * Pagination (Style UI v2): ringkasan di kiri, tombol angka kotak di kanan (aktif cobalt), « ‹ › ».
 * page (1-based) · totalPages · onChange(page)
 * meta: objek meta API ({page, per_page, total, total_pages}) — alternatif page/totalPages/total/perPage
 * total & perPage → teks "Menampilkan 11–20 dari 42"
 * showEdges: tombol halaman pertama/terakhir (default true) · showJump: "Ke halaman [ ] Buka" (default false)
 */
export function Pagination({ page: pageProp, totalPages: tpProp, total: totalProp, perPage: ppProp, meta, onChange, showEdges = true, showJump = false, className }) {
  const page = pageProp ?? meta?.page ?? 1;
  const totalPages = tpProp ?? meta?.total_pages ?? 1;
  const total = totalProp ?? meta?.total;
  const perPage = ppProp ?? meta?.per_page;
  const [jump, setJump] = useState('');
  const jumpId = useId();
  if (!totalPages || totalPages < 1) return null;
  const from = total != null && perPage ? Math.min(total, (page - 1) * perPage + 1) : null;
  const to = total != null && perPage ? Math.min(total, page * perPage) : null;
  const go = (p) => {
    const n = Math.max(1, Math.min(totalPages, p));
    if (n !== page && onChange) onChange(n);
  };

  return (
    <nav aria-label="Navigasi halaman" className={cn('flex flex-col items-center justify-between gap-3 md:flex-row', className)}>
      <p className="text-[13px] text-mist-700">
        {from != null ? (
          <>
            Menampilkan <span className="font-semibold text-obsidian tabular-nums">{from}–{to}</span> dari <span className="font-semibold text-obsidian tabular-nums">{total}</span>
          </>
        ) : (
          <>
            Halaman <span className="font-semibold text-obsidian">{page}</span> dari {totalPages}
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center justify-center gap-1">
          {showEdges && (
            <button type="button" className={cn(BTN, IDLE, 'hidden px-0 sm:inline-flex')} onClick={() => go(1)} disabled={page <= 1} aria-label="Halaman pertama">
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
          <button type="button" className={cn(BTN, IDLE, 'px-0')} onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Halaman sebelumnya">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pagesToShow(page, totalPages).map((p) =>
            typeof p === 'string' ? (
              <span key={p} className="px-1 text-mist-500" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Halaman ${p}`}
                className={cn(BTN, p === page ? 'bg-cobalt text-white ring-1 ring-inset ring-cobalt' : IDLE)}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className={cn(BTN, IDLE, 'px-0')} onClick={() => go(page + 1)} disabled={page >= totalPages} aria-label="Halaman berikutnya">
            <ChevronRight className="h-4 w-4" />
          </button>
          {showEdges && (
            <button type="button" className={cn(BTN, IDLE, 'hidden px-0 sm:inline-flex')} onClick={() => go(totalPages)} disabled={page >= totalPages} aria-label="Halaman terakhir">
              <ChevronsRight className="h-4 w-4" />
            </button>
          )}
        </div>
        {showJump && totalPages > 1 && (
          <form
            className="flex items-center gap-2 text-[13px] text-mist-700"
            onSubmit={(e) => {
              e.preventDefault();
              const n = parseInt(jump, 10);
              if (!Number.isNaN(n)) go(n);
              setJump('');
            }}
          >
            <label htmlFor={jumpId} className="whitespace-nowrap">
              Ke halaman
            </label>
            <input
              id={jumpId}
              inputMode="numeric"
              value={jump}
              onChange={(e) => setJump(e.target.value.replace(/\D/g, ''))}
              placeholder={String(page)}
              className="h-8 w-12 max-sm:h-9 max-sm:text-[16px] rounded-lg border border-mist-100 bg-white px-2 text-center text-[13px] tabular-nums text-obsidian outline-none placeholder:text-mist-500 hover:border-mist focus:border-cobalt focus:ring-1 focus:ring-cobalt"
            />
            <button type="submit" className={cn(BTN, IDLE, 'px-3 font-semibold text-obsidian')}>
              Buka
            </button>
          </form>
        )}
      </div>
    </nav>
  );
}

export default Pagination;
