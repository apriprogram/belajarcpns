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
                onClick={() => setOffset(0)}
                className="h-8 rounded-lg bg-ghost px-3 text-[13px] font-medium text-obsidian hover:bg-mist-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
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

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
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
              <p className="mt-0.5 truncate text-[15px] font-semibold text-obsidian">{nearest.title}</p>
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

function RoundBtn({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-obsidian ring-1 ring-inset ring-mist-100 transition-colors hover:bg-mist-50 hover:ring-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
    >
      {children}
    </button>
  );
}

export default WeekCalendarCard;
