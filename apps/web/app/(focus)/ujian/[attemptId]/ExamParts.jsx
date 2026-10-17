'use client';

import { AlertTriangle, CloudCheck, CloudOff, Clock3 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatTimer } from '@/lib/format';
import { Spinner } from '@/components/ui';

export const WARN_SECONDS = 5 * 60;

/** Timer besar monospace. remaining: detik (null = memuat). */
export function TimerPill({ remaining, className }) {
  const low = remaining != null && remaining <= WARN_SECONDS;
  const critical = remaining != null && remaining <= 60;
  return (
    <div
      role="timer"
      aria-label={`Sisa waktu ${remaining == null ? 'memuat' : formatTimer(remaining)}`}
      className={cn(
        'flex h-11 shrink-0 items-center gap-2 rounded-full px-4 ring-1 ring-inset transition-colors sm:h-12 sm:gap-2.5 sm:px-5',
        low ? 'bg-danger-50 text-danger-700 ring-danger/25' : 'bg-ghost text-obsidian ring-mist-100',
        className,
      )}
    >
      {low ? <AlertTriangle className={cn('h-[18px] w-[18px]', critical && 'animate-pulse')} aria-hidden /> : <Clock3 className="h-[18px] w-[18px] text-mist-700" aria-hidden />}
      <span className="font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl" aria-hidden>
        {remaining == null ? '--:--' : formatTimer(remaining)}
      </span>
    </div>
  );
}

/** Indikator autosave. state: idle | saving | saved | error */
export function SaveIndicator({ state, className }) {
  const conf = {
    idle: { icon: <CloudCheck className="h-4 w-4" />, text: 'Tersimpan otomatis', cls: 'text-mist-700' },
    saving: { icon: <Spinner size="xs" />, text: 'Menyimpan…', cls: 'text-mist-700' },
    saved: { icon: <CloudCheck className="h-4 w-4" />, text: 'Tersimpan', cls: 'text-mint-700' },
    error: { icon: <CloudOff className="h-4 w-4" />, text: 'Gagal menyimpan — mencoba lagi', cls: 'text-danger-700' },
  }[state || 'idle'];
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium', conf.cls, className)}>
      {conf.icon}
      {conf.text}
    </span>
  );
}

/** Status satu nomor soal. */
export function statusOf(ans) {
  if (ans && ans.is_flagged) return 'ragu';
  if (ans && ans.option_id) return 'dijawab';
  return 'belum';
}

/** Panel navigasi nomor soal, dikelompokkan per subtes. */
export function NavGrid({ questions, answers, current, onJump, counts }) {
  const groups = ['TWK', 'TIU', 'TKP']
    .map((code) => ({ code, items: questions.map((q, i) => ({ q, i })).filter((x) => x.q.subtest === code) }))
    .filter((g) => g.items.length);
  return (
    <div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-obsidian-600">
        <Legend swatch="bg-mist-50 ring-1 ring-inset ring-mist" label="Belum dijawab" n={counts.belum} />
        <Legend swatch="bg-cobalt" label="Dijawab" n={counts.dijawab} />
        <Legend swatch="bg-warning" label="Ragu-ragu" n={counts.ragu} />
        <Legend swatch="bg-white ring-2 ring-inset ring-obsidian" label="Soal aktif" />
      </div>
      <div className="mt-5 space-y-5">
        {groups.map((g) => (
          <section key={g.code} aria-label={`Soal ${g.code}`}>
            <p className="mb-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-obsidian">{g.code}</span>
              <span className="font-mono tabular-nums text-mist-700">
                {g.items.filter((x) => statusOf(answers[x.q.id]) !== 'belum').length}/{g.items.length}
              </span>
            </p>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-5">
              {g.items.map(({ q, i }) => {
                const a = answers[q.id];
                const st = statusOf(a);
                const isCur = i === current;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onJump(i)}
                    aria-current={isCur ? 'step' : undefined}
                    aria-label={`Soal ${i + 1}, ${st === 'belum' ? 'belum dijawab' : st === 'ragu' ? `ragu-ragu${a?.option_id ? ', sudah dijawab' : ''}` : 'dijawab'}`}
                    className={cn(
                      'relative flex h-11 items-center justify-center rounded-xl font-mono text-sm sm:h-10 sm:text-[13px] font-semibold tabular-nums transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30',
                      st === 'dijawab' && 'bg-cobalt text-white hover:bg-cobalt-600',
                      st === 'ragu' && 'bg-warning text-obsidian hover:brightness-95',
                      st === 'belum' && 'bg-mist-50 text-obsidian-600 ring-1 ring-inset ring-mist hover:bg-white hover:text-obsidian',
                      isCur && 'ring-2 ring-obsidian ring-offset-2 ring-offset-white',
                      isCur && st === 'belum' && 'text-obsidian ring-inset ring-offset-0',
                    )}
                  >
                    {i + 1}
                    {st === 'ragu' && a?.option_id && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cobalt ring-2 ring-white" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Legend({ swatch, label, n }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn('h-3.5 w-3.5 shrink-0 rounded-[5px]', swatch)} aria-hidden />
      <span className="truncate">{label}</span>
      {n != null && <span className="ml-auto font-mono font-semibold tabular-nums text-obsidian">{n}</span>}
    </span>
  );
}
