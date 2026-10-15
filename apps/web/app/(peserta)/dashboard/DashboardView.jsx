'use client';

import { BrandName } from '@/components/layout/Logo';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle2, Clock3, Crosshair, Megaphone, Timer, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { formatAngka, formatDurasi, formatRelatif, formatTanggal } from '@/lib/format';
import { useAuth } from '@/components/providers/AuthProvider';
import { Badge, Button, EmptyState, ErrorState, Gauge, ProgressBar } from '@/components/ui';
import { useResource } from '@/components/peserta/hooks';
import { greeting, POINTS_PER_QUESTION, SUBTESTS } from '@/components/peserta/constants';
import { DeltaPill, DetailLink, IconBox, MeterBars, PageHead, Panel, PanelHeader, PanelSkeleton, SoftPill, Sparkline, StatTile, ThinBar } from '../_components/kit';
import { WeekCalendarCard } from './WeekCalendarCard';
import { TargetsCard } from './TargetsCard';
import { TestimonialInviteCard } from './TestimonialInviteCard';

export function DashboardView() {
  const { user } = useAuth();
  const dash = useResource(() => api.get('/me/dashboard'), []);
  const pkgs = useResource(() => api.get('/packages').catch(() => []), []);
  const d = dash.data;
  const loading = dash.loading && !d;

  const firstName = (user?.name || '').split(' ')[0];
  const today = useMemo(() => formatTanggal(new Date(), 'long'), []);

  const setTargets = (updater) => dash.setData((prev) => (prev ? { ...prev, targets_today: typeof updater === 'function' ? updater(prev.targets_today || []) : updater } : prev));

  const s = d?.stats;
  const study = d?.study;
  const latest = d?.latest_result;
  const meterFilled = s ? Math.round(((Number(s.pass_rate) || 0) / 100) * 18) : 0;

  return (
    <>
      <PageHead
        crumbs={[{ label: 'Dashboard' }, { label: today }]}
        mascot="/maskot/dashboard.webp"
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        description="Ringkasan belajar, jadwal tryout, dan target Anda hari ini."
        actions={
          <>
            <Button variant="secondary" icon={<BookOpenCheck />} href="/latihan">
              Latihan soal
            </Button>
            <Button icon={<Timer />} href="/tryout">
              Ikuti tryout
            </Button>
          </>
        }
      />

      {dash.error && !d ? (
        <Panel padding="none">
          <ErrorState error={dash.error} onRetry={() => dash.reload()} title="Dashboard gagal dimuat" />
        </Panel>
      ) : (
        <div className="space-y-4">
          {/* Baris 1: 4 kartu statistik + grafik waktu belajar */}
          <div className="grid gap-4 xl:grid-cols-12 [&>*]:min-w-0">
            <div data-tour="stats" className="grid gap-4 sm:grid-cols-2 xl:col-span-7">
              <StatTile
                loading={loading}
                title="Waktu belajar hari ini"
                info="Dihitung otomatis saat Anda membuka halaman latihan atau ujian."
                action={<DetailLink href="/latihan">Belajar</DetailLink>}
                icon={Clock3}
                value={study ? formatAngka(study.today_minutes) : null}
                suffix="mnt"
                pill={study && <DeltaPill value={study.change_pct} suffix="%" />}
                chart={study && <Sparkline values={(study.days || []).map((x) => x.minutes)} label="Tren menit belajar 7 hari" />}
                caption={
                  study && (
                    <>
                      Kemarin <b className="font-semibold text-obsidian">{formatAngka(study.yesterday_minutes)} menit</b> belajar
                    </>
                  )
                }
              />
              <StatTile
                loading={loading}
                title="Rata-rata skor"
                info="Rata-rata skor total dari semua tryout yang sudah dikumpulkan (maks 550)."
                action={<DetailLink href="/riwayat">Detail</DetailLink>}
                icon={Trophy}
                value={s ? formatAngka(s.avg_score, { maxDecimals: 1 }) : null}
                suffix="/550"
                pill={latest && s ? <DeltaPill value={Math.round(latest.score_total - s.avg_score)} title="Selisih tryout terakhir terhadap rata-rata" /> : null}
                chart={s && <ThinBar value={s.avg_score} max={550} label="Rata-rata skor dari 550" />}
                caption={
                  s && (
                    <>
                      Terbaik <b className="font-semibold text-obsidian">{formatAngka(s.best_score)}</b>
                      {latest ? (
                        <>
                          {' '}· terakhir <b className="font-semibold text-obsidian">{formatAngka(latest.score_total)}</b>
                        </>
                      ) : null}
                    </>
                  )
                }
              />
              <StatTile
                loading={loading}
                title="Tryout selesai"
                info="Jumlah tryout yang sudah dikumpulkan dan persentase yang lulus passing grade."
                action={<DetailLink href="/tryout">Tryout</DetailLink>}
                icon={CheckCircle2}
                value={s ? formatAngka(s.attempts_done) : null}
                pill={s && <DeltaPill value={s.pass_rate} text={`${formatAngka(s.pass_rate)}% lulus`} />}
                chart={s && <MeterBars total={18} filled={meterFilled} label={`Tingkat lulus ${formatAngka(s.pass_rate)}%`} />}
                caption={
                  s && (
                    <>
                      <b className="font-semibold text-obsidian">{formatAngka(s.packages_available)}</b> paket tryout tersedia untuk dikerjakan
                    </>
                  )
                }
              />
              <StatTile
                loading={loading}
                title="Akurasi latihan"
                info="Persentase jawaban benar pada mode latihan soal."
                action={<DetailLink href="/latihan">Latihan</DetailLink>}
                icon={Crosshair}
                value={s ? formatAngka(s.practice_accuracy) : null}
                suffix="%"
                pill={s && <SoftPill tone="mint">{formatAngka(s.practice_answered)} soal</SoftPill>}
                chart={s && <ThinBar value={s.practice_accuracy} max={100} label={`Akurasi ${formatAngka(s.practice_accuracy)}%`} />}
                caption={s && <>Dari {formatAngka(s.practice_answered)} soal latihan yang dijawab</>}
              />
            </div>
            <div className="xl:col-span-5">{loading ? <PanelSkeleton className="h-full" height="h-64" /> : <StudyTimeCard study={study} />}</div>
          </div>

          {/* Baris 2: kalender minggu + target harian */}
          <div className="grid gap-4 xl:grid-cols-12 [&>*]:min-w-0">
            <div data-tour="kalender" className="xl:col-span-8">
              <WeekCalendarCard upcoming={d?.upcoming || []} targets={d?.targets_today || []} loading={loading} />
            </div>
            <div data-tour="target" className="xl:col-span-4">
              <TargetsCard targets={d?.targets_today || []} setTargets={setTargets} loading={loading} />
            </div>
          </div>

          {/* Baris 3: hasil terakhir + gauge + pengumuman */}
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-12 [&>*]:min-w-0">
            <div className="lg:col-span-2 xl:col-span-6">{loading ? <PanelSkeleton className="h-full" height="h-48" /> : <LatestResultCard result={latest} packages={pkgs.data || []} />}</div>
            <div className="xl:col-span-3">{loading ? <PanelSkeleton className="h-full" height="h-48" /> : <ScoreGaugeCard stats={s} />}</div>
            <div className="flex flex-col gap-4 xl:col-span-3 [&>*]:min-w-0">
              {loading ? <PanelSkeleton className="flex-1" height="h-48" /> : <AnnouncementsCard items={d.announcements || []} />}
              <TestimonialInviteCard />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

/** Grafik batang menit belajar 7 hari: batang aktif cobalt, lainnya pucat, garis rata-rata, tooltip gelap. */
function StudyTimeCard({ study }) {
  const days = study?.days || [];
  const [active, setActive] = useState(days.length - 1);
  const max = Math.max(30, ...days.map((x) => x.minutes || 0));
  const top = Math.ceil(max / 30) * 30;
  const avg = days.length ? days.reduce((a, x) => a + (x.minutes || 0), 0) / days.length : 0;
  const cur = days[active];
  const H = 200;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Total waktu belajar" info="Menit belajar per hari selama 7 hari terakhir." action={<DetailLink href="/latihan">Mulai latihan</DetailLink>} />
      <div className="flex flex-wrap items-center gap-3">
        <IconBox icon={Clock3} />
        <p className="text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{formatDurasi(study?.week_minutes || 0, { unit: 'minutes' })}</p>
        <DeltaPill value={study?.change_pct} suffix="%" />
        <span className="text-[13px] text-mist-700">hari ini vs kemarin</span>
      </div>

      {!days.length ? (
        <EmptyState size="sm" title="Belum ada data" description="Waktu belajar akan tercatat setelah Anda berlatih." className="flex-1" />
      ) : (
        <div className="relative mt-6 flex-1">
          <div className="relative pr-9" style={{ height: H }}>
            {/* garis bantu + label sumbu Y */}
            {[0, 0.5, 1].map((f) => (
              <div key={f} className="absolute inset-x-0 flex items-center" style={{ bottom: f * H }} aria-hidden>
                <span className="h-px flex-1 border-t border-dashed border-mist-100" />
                <span className="w-9 pl-2 text-right font-mono text-[11px] tabular-nums text-mist-500">{Math.round(top * f)}</span>
              </div>
            ))}
            {avg > 0 && (
              <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ bottom: (avg / top) * H }} aria-hidden>
                <span className="rounded-md bg-obsidian px-1.5 py-0.5 text-[10px] font-semibold text-white">Rata²</span>
                <span className="h-px flex-1 border-t-2 border-dotted border-obsidian/60" />
              </div>
            )}
            <div className="absolute inset-0 right-9 flex items-end gap-2 sm:gap-3" role="group" aria-label="Menit belajar per hari">
              {days.map((x, i) => {
                const h = Math.max(4, ((x.minutes || 0) / top) * H);
                const on = i === active;
                return (
                  <button
                    key={x.day || i}
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-label={`${x.label}: ${formatAngka(x.minutes)} menit`}
                    aria-pressed={on}
                    className="group relative flex h-full flex-1 items-end focus-visible:outline-none"
                  >
                    <span className={cn('block w-full rounded-t-lg rounded-b-sm transition-colors group-focus-visible:ring-2 group-focus-visible:ring-cobalt', on ? 'bg-cobalt' : 'bg-cobalt-50 group-hover:bg-cobalt-100')} style={{ height: h }} />
                  </button>
                );
              })}
            </div>
            {cur && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-xl bg-obsidian px-3 py-2 text-white"
                style={{ left: `calc(${((active + 0.5) / days.length) * 100}% - ${((active + 0.5) / days.length) * 36}px)`, bottom: Math.min(H - 8, Math.max(4, ((cur.minutes || 0) / top) * H) + 10) }}
                aria-hidden
              >
                <p className="text-[11px] text-white/60">{cur.day ? formatTanggal(cur.day + 'T12:00:00+07:00', 'day-month') : cur.label}</p>
                <p className="whitespace-nowrap text-sm font-semibold tabular-nums">{formatDurasi(cur.minutes || 0, { unit: 'minutes' })}</p>
              </div>
            )}
          </div>
          <div className="mt-2 flex gap-2 pr-9 sm:gap-3" aria-hidden>
            {days.map((x, i) => (
              <span key={x.day || i} className={cn('flex-1 text-center text-xs', i === active ? 'font-semibold text-obsidian' : 'text-mist-700')}>
                {x.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

function ScoreGaugeCard({ stats }) {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Progres skor" info="Rata-rata skor total dibanding skor maksimum 550." />
      <div className="flex flex-1 items-center justify-center">
        <Gauge value={stats.avg_score} max={550} size={220} thickness={20} label="rata-rata skor" valueText={formatAngka(stats.avg_score, { maxDecimals: 1 })} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-ghost p-3">
          <p className="flex items-center gap-1.5 text-xs text-mist-700">
            <span className="h-2 w-2 rounded-full bg-mint-700" aria-hidden />
            Tingkat lulus
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatAngka(stats.pass_rate)}%</p>
        </div>
        <div className="rounded-xl bg-ghost p-3">
          <p className="flex items-center gap-1.5 text-xs text-mist-700">
            <span className="h-2 w-2 rounded-full bg-cobalt" aria-hidden />
            Skor terbaik
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{formatAngka(stats.best_score)}</p>
        </div>
      </div>
    </Panel>
  );
}

function LatestResultCard({ result, packages }) {
  if (!result) {
    return (
      <Panel className="flex h-full flex-col">
        <PanelHeader title="Hasil terakhir" />
        <EmptyState
          size="sm"
          icon={<Trophy />}
          title="Belum ada hasil tryout"
          description="Kerjakan tryout pertama Anda untuk melihat skor per subtes dan perbandingannya dengan passing grade."
          action={
            <Button size="sm" href="/tryout" iconRight={<ArrowRight />}>
              Pilih paket
            </Button>
          }
          className="flex-1"
        />
      </Panel>
    );
  }
  const pkg = packages.find((p) => p.id === result.package_id);
  const rows = SUBTESTS.map((s) => {
    const key = s.code.toLowerCase();
    const count = pkg?.counts?.[s.code];
    return {
      ...s,
      score: result[`score_${key}`],
      pass: pkg ? pkg[`pass_${key}`] : null,
      max: count != null ? count * POINTS_PER_QUESTION : { TWK: 150, TIU: 175, TKP: 225 }[s.code],
    };
  }).filter((r) => r.max > 0);
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Hasil terakhir"
        info="Skor tryout terakhir per subtes dibanding passing grade paket."
        action={<DetailLink href={`/hasil/${result.attempt_id}`}>Pembahasan</DetailLink>}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconBox icon={Trophy} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{result.package_title}</p>
            <p className="text-[13px] text-mist-700">
              {formatTanggal(result.created_at)} · {formatDurasi(result.duration_seconds)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={result.passed ? 'lulus' : 'gagal'} />
          <p className="text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{formatAngka(result.score_total)}</p>
        </div>
      </div>
      <div className={cn('grid gap-2.5', rows.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
        {rows.map((r) => {
          const ok = r.pass == null ? null : r.score >= r.pass;
          return (
            <div key={r.code} className="rounded-2xl bg-ghost p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold">{r.code}</span>
                {ok != null && <span className={cn('text-xs font-semibold', ok ? 'text-mint-700' : 'text-danger-700')}>{ok ? 'Memenuhi' : 'Di bawah PG'}</span>}
              </div>
              <p className="mb-3 text-2xl font-semibold tabular-nums">
                {formatAngka(r.score)}
                <span className="text-sm font-medium text-mist-500">/{r.max}</span>
              </p>
              <ProgressBar value={r.score} max={r.max} marker={r.pass || null} color={ok === false ? 'danger' : ok ? 'mint-dark' : 'cobalt'} size="sm" />
              {r.pass != null && <p className="mt-2 text-xs text-mist-700">Passing grade {r.pass}</p>}
            </div>
          );
        })}
      </div>
      <AnswerSummary correct={result.correct_count} wrong={result.wrong_count} empty={result.empty_count} />
      <div className="mt-auto flex flex-wrap justify-end gap-2 pt-4">
        <Button variant="secondary" size="sm" href="/riwayat" className="!shadow-none">
          Semua riwayat
        </Button>
        <Button size="sm" href={`/hasil/${result.attempt_id}`} iconRight={<ArrowRight />} className="!shadow-none">
          Lihat pembahasan
        </Button>
      </div>
    </Panel>
  );
}

function AnswerSummary({ correct, wrong, empty }) {
  const parts = [
    ['Benar', correct, 'bg-mint-700'],
    ['Salah', wrong, 'bg-danger'],
    ['Kosong', empty, 'bg-mist'],
  ];
  const total = correct + wrong + empty;
  return (
    <div className="mt-4">
      <div className="flex h-2 gap-1" role="img" aria-label={`${correct} benar, ${wrong} salah, ${empty} kosong dari ${total} soal`}>
        {parts
          .filter(([, n]) => n > 0)
          .map(([l, n, c]) => (
            <span key={l} className={cn('rounded-full', c)} style={{ flexGrow: n, flexBasis: 0 }} />
          ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-mist-700">
        {parts.map(([l, n, c]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-full', c)} aria-hidden />
            {l} <span className="font-mono font-semibold tabular-nums text-obsidian">{n}</span>
          </span>
        ))}
        <span className="ml-auto font-mono tabular-nums">{total} soal</span>
      </div>
    </div>
  );
}

function AnnouncementsCard({ items }) {
  return (
    <Panel className="flex flex-1 flex-col">
      <PanelHeader title="Pengumuman" info={<>Info terbaru dari tim <BrandName />.</>} action={items.length ? <SoftPill tone="ghost">{items.length}</SoftPill> : null} />
      {!items.length ? (
        <EmptyState size="sm" icon={<Megaphone />} title="Belum ada pengumuman" description="Info terbaru dari admin akan tampil di sini." className="flex-1" />
      ) : (
        <ul className="-mx-1 divide-y divide-mist-100">
          {items.slice(0, 4).map((a) => (
            <li key={a.id} className="flex gap-3 px-1 py-3 first:pt-0 last:pb-0">
              <IconBox icon={Megaphone} tone="ghost" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug">{a.title}</p>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-mist-700">{a.body}</p>
                <p className="mt-1 text-[11px] font-medium text-mist-500">{formatRelatif(a.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default DashboardView;
