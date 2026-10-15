/* eslint-disable @next/next/no-img-element */
import { CheckCircle2, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Chip } from '@/components/ui';
import { StatusPill } from './AdminUI';
import { SubtestChip } from './AdminParts';
import { LABELS } from './shared';

/**
 * Pratinjau soal seperti tampilan peserta.
 * question: { subtest, category_name, difficulty, body, image_url, explanation, options:[{label?, body, weight}] }
 * showKey: tampilkan kunci/bobot & pembahasan · number: nomor soal
 */
export function QuestionPreview({ question, showKey = true, number, compact, className }) {
  const q = question || {};
  const options = q.options || [];
  const isTKP = q.subtest === 'TKP';
  const maxW = Math.max(0, ...options.map((o) => Number(o.weight) || 0));
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {number != null && (
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-obsidian px-2 font-mono text-xs font-semibold text-white">{number}</span>
        )}
        {q.subtest && <SubtestChip code={q.subtest} />}
        {q.category_name && (
          <Chip size="sm" color="mist">
            {q.category_name}
          </Chip>
        )}
        {q.difficulty && <StatusPill status={q.difficulty} dot={false} />}
      </div>

      <p className={cn('mt-4 whitespace-pre-line break-words font-medium leading-relaxed text-obsidian', compact ? 'text-[15px]' : 'text-base sm:text-[17px]')}>
        {q.body?.trim() ? q.body : <span className="text-mist-500">Teks soal akan tampil di sini…</span>}
      </p>

      {q.image_url && (
        <div className="mt-4 overflow-hidden rounded-2xl bg-ghost ring-1 ring-inset ring-mist-100">
          <img src={q.image_url} alt="Gambar soal" className="mx-auto max-h-72 w-auto object-contain" />
        </div>
      )}

      <ul className="mt-5 space-y-2.5">
        {LABELS.map((label, i) => {
          const o = options[i] || {};
          const w = Number(o.weight) || 0;
          const isKey = showKey && !isTKP && w > 0;
          const isBest = showKey && isTKP && w === maxW && w > 0;
          return (
            <li
              key={label}
              className={cn(
                'flex items-start gap-3 rounded-xl p-3 ring-1 ring-inset transition-colors',
                isKey ? 'bg-mint-50 ring-mint-100' : 'bg-white ring-mist-100',
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold',
                  isKey ? 'bg-mint text-obsidian' : 'bg-ghost text-obsidian-600',
                )}
              >
                {label}
              </span>
              <span className={cn('min-w-0 flex-1 break-words pt-1 text-sm leading-relaxed', !o.body && 'text-mist-500')}>{o.body || `Opsi ${label}`}</span>
              {showKey && isTKP && (
                <span
                  className={cn(
                    'mt-0.5 shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-semibold tabular-nums',
                    isBest ? 'bg-mint-100 text-mint-700' : 'bg-ghost text-obsidian-600',
                  )}
                  title="Bobot"
                >
                  {w || '–'} poin
                </span>
              )}
              {isKey && <CheckCircle2 className="mt-1.5 h-[18px] w-[18px] shrink-0 text-mint-700" aria-label="Kunci jawaban" />}
            </li>
          );
        })}
      </ul>

      {showKey && (
        <div className="mt-5 rounded-xl bg-cobalt-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-cobalt-700">
            <Lightbulb className="h-4 w-4" /> Pembahasan
          </p>
          <p className={cn('mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed', q.explanation ? 'text-obsidian-600' : 'text-mist-500')}>
            {q.explanation || 'Belum ada pembahasan.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default QuestionPreview;
