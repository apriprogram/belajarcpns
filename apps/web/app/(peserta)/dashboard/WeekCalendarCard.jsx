'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatJam, formatTanggal, isoDay } from '@/lib/format';
import { Button, Chip } from '@/components/ui';
import { SUBTEST_TONE } from '@/components/peserta/constants';
import { Panel, PanelHeader } from '../_components/kit';

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** "YYYY-MM-DD" → Date UTC tengah malam (aman untuk aritmatika hari). */
const parseDay = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const dayKey = (d) => d.toISOString().slice(0, 10);
const fmtTime = (t = '') => String(t).slice(0, 5).replace(':', '.');

function buildWeek(todayKey, offset) {
  const today = parseDay(todayKey);
  const dow = (today.getUTCDay() + 6) % 7; // Senin = 0
  const monday = new Date(today.getTime() - dow * 86400000 + offset * 7 * 86400000);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime() + i * 86400000);
    return { key: dayKey(d), label: DAY_LABELS[i], date: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };
  });
}

function relativeDay(key, todayKey) {
  const diff = Math.round((parseDay(key) - parseDay(todayKey)) / 86400000);
  if (diff === 0) return 'Hari ini';
  if (diff === 1) return 'Besok';
  if (diff === -1) return 'Kemarin';
  return formatTanggal(key + 'T12:00:00+07:00', 'long');
}

/**
 * Kalender minggu (Sen–Min) gaya week-view: kolom per hari berisi kartu jadwal tryout
 * dan target hari ini, plus ringkasan jadwal ujian terdekat.
 */
export function WeekCalendarCard({ upcoming = [], targets = [], loading }) {
  const todayKey = useMemo(() => isoDay(), []);
  const [offset, setOffset] = useState(0);
  const week = useMemo(() => buildWeek(todayKey, offset), [todayKey, offset]);
  // Tampilan HP: hari terpilih pada strip 7 hari (default hari ini / Senin minggu lain)
  const [picked, setPicked] = useState(null);
  const pickedKey = picked && week.some((d) => d.key === picked) ? picked : week.some((d) => d.key === todayKey) ? todayKey : week[0].key;

  const examDays = useMemo(() => {
    const m = {};
    upcoming.forEach((u) => {
      if (u.start_at) {
        const k = isoDay(u.start_at);
        (m[k] = m[k] || []).push(u);
      }
    });
    return m;
  }, [upcoming]);
  const sortedTargets = useMemo(() => [...targets].sort((a, b) => String(a.due_time).localeCompare(String(b.due_time))), [targets]);

  const nearest = upcoming.find((u) => u.start_at) || upcoming[0];
  const flexible = upcoming.filter((u) => !u.start_at);

  const first = week[0];
  const last = week[6];
  const monthLabel = first.month === last.month ? `${MONTHS[first.month]} ${first.year}` : `${MONTHS[first.month].slice(0, 3)} – ${MONTHS[last.month].slice(0, 3)} ${last.year}`;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Kalender minggu ini"
        info="Jadwal tryout terbuka dan target belajar hari ini."
        subtitle={monthLabel}
        action={
          <>
            {offset !== 0 && (
              <button
                type="button"
                onClick={() => {
                  setOffset(0);
                  setPicked(null);
                }}
                className="h-9 rounded-lg sm:h-8 bg-ghost px-3 text-[13px] font-medium text-obsidian hover:bg-mist-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
              >
                Hari ini
              </button>
            )}
            <RoundBtn label="Minggu sebelumnya" onClick={() => setOffset((o) => o - 1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </RoundBtn>
            <RoundBtn label="Minggu berikutnya" onClick={() => setOffset((o) => o + 1)}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </RoundBtn>
          </>
        }
      />

      {/* HP (< 640px): strip 7 hari + daftar agenda hari terpilih — tanpa gulir horizontal */}
      <MobileWeek week={week} todayKey={todayKey} pickedKey={pickedKey} onPick={setPicked} examDays={examDays} targets={sortedTargets} loading={loading} />

      <div className="relative -mx-1 hidden overflow-x-auto px-1 pb-1 sm:block">
        <ul className="grid min-w-[700px] grid-cols-7 overflow-hidden rounded-2xl ring-1 ring-inset ring-mist-100" aria-label={`Minggu ${monthLabel}`}>
          {week.map((d, i) => {
            const isToday = d.key === todayKey;
            const past = d.key < todayKey;
            const exams = examDays[d.key] || [];
            const tg = isToday ? sortedTargets : [];
            return (
              <li key={d.key} aria-current={isToday ? 'date' : undefined} className={cn('flex min-w-0 flex-col', i > 0 && 'border-l border-mist-100')}>
                <div className={cn('flex h-11 items-center justify-center gap-1.5 border-b border-mist-100 text-xs font-medium uppercase tracking-wide', isToday ? 'text-obsidian' : 'text-mist-700')}>
                  <span className="sr-only">{relativeDay(d.key, todayKey)}, </span>
                  {d.label}
                  <span className={cn('rounded-md px-1.5 py-0.5 text-[13px] font-semibold tabular-nums', isToday ? 'bg-cobalt text-white' : 'text-obsidian-600')}>{d.date}</span>
                </div>
                <div className={cn('flex min-h-[188px] flex-1 flex-col gap-1.5 p-1.5', past && 'bg-mist-50/70')}>
                  {loading && isToday && <span className="h-14 animate-pulse rounded-xl bg-ghost" />}
                  {exams.map((u) => (
                    <Link
                      key={u.id}
                      href={`/tryout/${u.id}`}
                      title={u.title}
                      className="block rounded-xl bg-cobalt-50 p-2 ring-1 ring-inset ring-cobalt-100 transition-colors hover:bg-cobalt-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                    >
                      <span className="flex items-start justify-between gap-1">
                        <span className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-obsidian">{u.title}</span>
                        <span className="shrink-0 text-[10px] font-semibold uppercase text-cobalt-700">CBT</span>
                      </span>
                      <span className="mt-1 block font-mono text-[11px] tabular-nums text-obsidian-600">
                        {formatJam(u.start_at)}
                        {u.end_at && isoDay(u.end_at) === d.key ? `–${formatJam(u.end_at)}` : ''}
                      </span>
                    </Link>
                  ))}
                  {tg.map((t) => {
                    const tone = SUBTEST_TONE[t.subtest] || SUBTEST_TONE.SKD;
                    return (
                      <div key={t.id} title={t.title} className={cn('rounded-xl p-2 ring-1 ring-inset', tone.bg, tone.ring, t.done && 'opacity-60')}>
                        <span className="flex items-start justify-between gap-1">
                          <span className={cn('line-clamp-2 text-[12.5px] font-semibold leading-snug text-obsidian', t.done && 'line-through')}>{t.title}</span>
                          <span className={cn('shrink-0 text-[10px] font-semibold uppercase', tone.text)}>{t.subtest === 'SKD' ? 'Umum' : t.subtest}</span>
                        </span>
                        <span className="mt-1 block font-mono text-[11px] tabular-nums text-obsidian-600">{fmtTime(t.due_time)}</span>
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-ghost p-4 sm:flex-row sm:items-center sm:justify-between">
        {loading ? (
          <span className="h-10 w-2/3 animate-pulse rounded-xl bg-mist-100" />
        ) : nearest ? (
          <>
            <div className="min-w-0">
              <p className="text-xs font-medium text-mist-700">Jadwal ujian terdekat</p>
              <p className="mt-0.5 truncate text-[14px] font-semibold text-obsidian sm:text-[15px]">{nearest.title}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Chip color="white" size="sm" icon={nearest.start_at ? <CalendarDays /> : <InfinityIcon />}>
                  {nearest.start_at ? `${relativeDay(isoDay(nearest.start_at), todayKey)}, ${formatJam(nearest.start_at)} WIB` : 'Fleksibel'}
                </Chip>
                <Chip color="white" size="sm" icon={<Clock3 />} mono>
                  {nearest.duration_minutes} menit
                </Chip>
                <Chip color="white" size="sm" icon={<FileText />} mono>
                  {nearest.question_count} soal
                </Chip>
                {flexible.length > 0 && nearest.start_at && (
                  <Chip color="white" size="sm" icon={<InfinityIcon />}>
                    {flexible.length} paket tanpa jadwal
                  </Chip>
                )}
              </div>
            </div>
            <Button size="sm" href={`/tryout/${nearest.id}`} iconRight={<ArrowRight />} className="shrink-0 !shadow-none">
              Lihat paket
            </Button>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-mist-700">
            <CalendarDays className="h-4 w-4" aria-hidden />
            Belum ada jadwal ujian. Paket tryout baru akan muncul di sini.
          </p>
        )}
      </div>
    </Panel>
  );
}

function MobileWeek({ week, todayKey, pickedKey, onPick, examDays, targets, loading }) {
  const exams = examDays[pickedKey] || [];
  const tg = pickedKey === todayKey ? targets : [];
  const isPast = pickedKey < todayKey;
  return (
    <div className="sm:hidden">
      <ul className="grid grid-cols-7 gap-1" aria-label="Pilih hari">
        {week.map((d) => {
          const isToday = d.key === todayKey;
          const sel = d.key === pickedKey;
          const has = (examDays[d.key] || []).length > 0 || (isToday && targets.length > 0);
          return (
            <li key={d.key} className="min-w-0">
              <button
                type="button"
                onClick={() => onPick(d.key)}
                aria-pressed={sel}
                aria-current={isToday ? 'date' : undefined}
                aria-label={`${relativeDay(d.key, todayKey)}${has ? ', ada agenda' : ''}`}
                className={cn(
                  'relative flex h-[52px] w-full flex-col sm:h-[60px] items-center justify-center gap-0.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
                  sel ? 'bg-cobalt text-white' : isToday ? 'bg-cobalt-50 text-cobalt-700 ring-1 ring-inset ring-cobalt-100' : 'bg-ghost text-obsidian-600',
                )}
              >
                <span className={cn('text-[11px] font-medium uppercase', sel ? 'text-white/75' : 'text-mist-700')}>{d.label}</span>
                <span className="text-[14px] font-semibold tabular-nums sm:text-[15px]">{d.date}</span>
                <span className={cn('h-1 w-1 rounded-full', has ? (sel ? 'bg-white' : 'bg-cobalt') : 'bg-transparent')} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 rounded-2xl p-3 ring-1 ring-inset ring-mist-100">
        <p className="mb-2 text-[13px] font-semibold text-obsidian">{relativeDay(pickedKey, todayKey)}</p>
        {loading && pickedKey === todayKey ? (
          <span className="block h-14 animate-pulse rounded-xl bg-ghost" />
        ) : !exams.length && !tg.length ? (
          <p className="py-2 text-[13px] text-mist-700">{isPast ? 'Tidak ada agenda di hari ini.' : 'Belum ada jadwal tryout atau target di hari ini.'}</p>
        ) : (
          <ul className="space-y-2">
            {exams.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/tryout/${u.id}`}
                  className="flex min-h-[52px] items-center gap-3 rounded-xl bg-cobalt-50 px-3 py-2.5 ring-1 ring-inset ring-cobalt-100 transition-colors hover:bg-cobalt-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                >
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-obsidian">{u.title}</span>
                    <span className="mt-0.5 block font-mono text-xs tabular-nums text-obsidian-600">
                      {formatJam(u.start_at)}
                      {u.end_at && isoDay(u.end_at) === pickedKey ? `–${formatJam(u.end_at)}` : ''} WIB
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold uppercase text-cobalt-700">CBT</span>
                </Link>
              </li>
            ))}
            {tg.map((t) => {
              const tone = SUBTEST_TONE[t.subtest] || SUBTEST_TONE.SKD;
              return (
                <li key={t.id} className={cn('flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-2.5 ring-1 ring-inset', tone.bg, tone.ring, t.done && 'opacity-60')}>
                  <span className="min-w-0 flex-1">
                    <span className={cn('line-clamp-2 text-sm font-semibold leading-snug text-obsidian', t.done && 'line-through')}>{t.title}</span>
                    <span className="mt-0.5 block font-mono text-xs tabular-nums text-obsidian-600">{fmtTime(t.due_time)}</span>
                  </span>
                  <span className={cn('shrink-0 text-[11px] font-semibold uppercase', tone.text)}>{t.subtest === 'SKD' ? 'Umum' : t.subtest}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function RoundBtn({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white sm:h-8 sm:w-8 text-obsidian ring-1 ring-inset ring-mist-100 transition-colors hover:bg-mist-50 hover:ring-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
    >
      {children}
    </button>
  );
}

export default WeekCalendarCard;
