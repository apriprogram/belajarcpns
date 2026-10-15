'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Lightbulb, Medal, Printer, Users, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api, ApiError } from '@/lib/api';
import { formatAngka, formatDurasi, formatTanggalJam } from '@/lib/format';
import { Badge, Button, Chip, EmptyState, ErrorState, Gauge, Pagination, ProgressBar, Skeleton, SUBTEST_COLOR } from '@/components/ui';
import { OptionButton } from '@/components/peserta/OptionButton';
import { useResource } from '@/components/peserta/hooks';
import { SUBTESTS } from '@/components/peserta/constants';
import { IconBox, PageHead, Panel, PanelHeader, PanelSkeleton, Segmented } from '../../_components/kit';

const CRUMBS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tryout', label: 'Tryout' },
];

const PER_PAGE = 10;

export function HasilView({ attemptId }) {
  const res = useResource(() => api.get(`/results/${attemptId}`), [attemptId]);
  const r = res.data;
  const pending = res.error instanceof ApiError && res.error.code === 'ATTEMPT_NOT_FINISHED';

  // Hasil belum final (mis. waktu habis tapi server belum memfinalisasi) → coba lagi otomatis.
  useEffect(() => {
    if (!pending) return undefined;
    const t = setTimeout(() => res.reload({ silent: true }), 4000);
    return () => clearTimeout(t);
  }, [pending, res]);

  if (res.error && !r) {
    const notFound = res.error.status === 404;
    return (
      <>
        <PageHead crumbs={[...CRUMBS, { label: 'Hasil' }]} title="Hasil tryout" />
        <Panel padding="none">
          {pending ? (
            <EmptyState icon={<Clock3 />} title="Hasil sedang diproses" description="Ujian sedang difinalisasi oleh server. Halaman akan diperbarui otomatis." />
          ) : (
            <ErrorState error={res.error} title={notFound ? 'Hasil tidak ditemukan' : 'Hasil gagal dimuat'} onRetry={notFound ? undefined : () => res.reload()} />
          )}
        </Panel>
      </>
    );
  }

  if (!r) {
    return (
      <>
        <Panel className="mb-4">
          <Skeleton className="h-4 w-40" rounded="rounded-md" />
          <Skeleton className="mt-3 h-8 w-2/3 max-w-lg" rounded="rounded-lg" />
        </Panel>
        <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
          <PanelSkeleton className="lg:col-span-8" height="h-56" />
          <PanelSkeleton className="lg:col-span-4" height="h-56" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <PanelSkeleton key={i} height="h-24" />
          ))}
        </div>
      </>
    );
  }

  const max = r.max || {};
  const maxTotal = (max.TWK || 0) + (max.TIU || 0) + (max.TKP || 0);
  const subs = SUBTESTS.map((s) => {
    const k = s.code.toLowerCase();
    const score = r[`score_${k}`];
    const pass = r.package?.[`pass_${k}`] || 0;
    const m = max[s.code] || 0;
    return { ...s, score, pass, max: m, ok: score >= pass, tested: m > 0 };
  });
  const failed = subs.filter((s) => s.tested && !s.ok).map((s) => s.code);
  const totalOk = !r.package?.pass_total || r.score_total >= r.package.pass_total;
  const totalQ = r.correct_count + r.wrong_count + r.empty_count;

  return (
    <>
      <PageHead
        crumbs={[...CRUMBS, { label: 'Hasil & pembahasan' }]}
        title={r.package?.title}
        description="Skor per subtes, status kelulusan, peringkat, dan pembahasan setiap soal."
        meta={
          <>
            <Chip color="white" size="sm" icon={<CalendarDays />}>
              {formatTanggalJam(r.submitted_at)}
            </Chip>
            <Chip color="white" size="sm" icon={<Clock3 />} mono>
              {formatDurasi(r.duration_seconds)}
            </Chip>
            <Chip color="white" size="sm" icon={<Users />}>
              {r.participants} peserta
            </Chip>
          </>
        }
        actions={
          <div className="flex gap-2 print:hidden [&_a]:!shadow-none [&_button]:!shadow-none">
            <Button variant="secondary" icon={<Printer />} onClick={() => window.print()}>
              Cetak
            </Button>
            <Button icon={<ArrowLeft />} href="/tryout">
              Ke daftar tryout
            </Button>
          </div>
        }
      />

      {/* --------------------------- HERO --------------------------- */}
      <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        <Panel className="lg:col-span-8">
          <PanelHeader title="Skor total" info="Lulus bila setiap subtes ≥ passing grade dan total ≥ passing grade total." />
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em]',
                  r.passed ? 'bg-mint text-obsidian' : 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger/20',
                )}
              >
                {r.passed ? <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden /> : <XCircle className="h-[18px] w-[18px]" aria-hidden />}
                {r.passed ? 'Lulus' : 'Tidak lulus'}
              </span>
              <p className="mt-5 text-[56px] font-semibold leading-none tracking-tightest tabular-nums">
                {formatAngka(r.score_total)}
                <span className="ml-1 text-2xl font-medium text-mist-500">/{maxTotal}</span>
              </p>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-obsidian-600">
                {r.passed
                  ? 'Selamat! Anda memenuhi passing grade di semua subtes. Pertahankan dengan latihan rutin.'
                  : failed.length
                    ? `Skor ${failed.join(', ')} masih di bawah passing grade. Fokuskan latihan pada subtes tersebut.`
                    : !totalOk
                      ? `Skor total belum mencapai passing grade ${r.package.pass_total}.`
                      : 'Belum memenuhi syarat kelulusan.'}
              </p>
            </div>
            <Gauge
              value={r.score_total}
              max={maxTotal || 1}
              color={r.passed ? 'mint-dark' : 'cobalt'}
              size={240}
              label={`${maxTotal ? Math.round((r.score_total / maxTotal) * 100) : 0}% dari maks`}
              marker={r.package?.pass_total || null}
              className="shrink-0"
            />
          </div>
        </Panel>

        <Panel className="flex flex-col lg:col-span-4">
          <PanelHeader title="Peringkat" info="Peringkat skor total di antara peserta paket ini." />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[48px] font-semibold leading-none tracking-tightest tabular-nums">
                <span className="text-mist-500">#</span>
                {r.rank}
              </p>
              <p className="mt-2 text-sm text-mist-700">dari {r.participants} peserta paket ini</p>
            </div>
            <IconBox icon={Medal} tone="obsidian" size="lg" />
          </div>
          <div className="mt-auto pt-8">
            <div className="mb-3 flex h-2.5 w-full gap-1" role="img" aria-label={`${r.correct_count} benar, ${r.wrong_count} salah, ${r.empty_count} kosong`}>
              {[
                [r.correct_count, 'bg-mint-700'],
                [r.wrong_count, 'bg-danger'],
                [r.empty_count, 'bg-mist'],
              ]
                .filter(([n]) => n > 0)
                .map(([n, c], i) => (
                  <span key={i} className={cn('rounded-full', c)} style={{ flexGrow: n, flexBasis: 0 }} />
                ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Benar', r.correct_count, 'text-mint-700'],
                ['Salah', r.wrong_count, 'text-danger-700'],
                ['Kosong', r.empty_count, 'text-obsidian-600'],
              ].map(([l, v, c]) => (
                <div key={l} className="rounded-xl bg-ghost p-3">
                  <p className={cn('text-xl font-semibold tabular-nums', c)}>{v}</p>
                  <p className="mt-0.5 text-xs text-mist-700">{l}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs text-mist-700">{totalQ} soal · durasi {formatDurasi(r.duration_seconds)}</p>
          </div>
        </Panel>
      </div>

      {/* ------------------------ KARTU SUBTES ------------------------ */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {subs.map((s) => (
          <Panel key={s.code} className={cn(!s.tested && 'hidden opacity-70 md:block')}>
            <div className="flex items-center justify-between gap-2">
              <Chip color={SUBTEST_COLOR[s.code]} size="sm">
                {s.code}
              </Chip>
              {s.tested ? <Badge status={s.ok ? 'lulus' : 'gagal'} size="sm">{s.ok ? 'Memenuhi' : 'Di bawah PG'}</Badge> : <Badge status="kosong" size="sm">Tidak diujikan</Badge>}
            </div>
            <p className="mt-3 text-sm text-mist-700">{s.name}</p>
            <p className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
              {s.tested ? formatAngka(s.score) : '—'}
              {s.tested && <span className="ml-1 text-lg font-medium text-mist-500">/{s.max}</span>}
            </p>
            <ProgressBar value={s.tested ? s.score : 0} max={s.max || 1} marker={s.tested && s.pass ? s.pass : null} color={!s.tested ? 'cobalt' : s.ok ? 'mint-dark' : 'danger'} size="md" className="mt-5" />
            <div className="mt-3 flex items-center justify-between text-xs text-mist-700">
              <span>
                Passing grade <span className="font-semibold tabular-nums text-obsidian">{s.pass}</span>
              </span>
              {s.tested && (
                <span className={cn('font-semibold tabular-nums', s.ok ? 'text-mint-700' : 'text-danger-700')}>
                  {s.ok ? `+${formatAngka(s.score - s.pass)} di atas PG` : `Kurang ${formatAngka(s.pass - s.score)}`}
                </span>
              )}
            </div>
          </Panel>
        ))}
      </div>

      <Review review={r.review || []} />
    </>
  );
}

/* --------------------------- PEMBAHASAN --------------------------- */
function Review({ review }) {
  const [status, setStatus] = useState('semua');
  const [subtest, setSubtest] = useState('');
  const [page, setPage] = useState(1);

  const subtests = useMemo(() => ['TWK', 'TIU', 'TKP'].filter((c) => review.some((x) => x.subtest === c)), [review]);
  const bySub = useMemo(() => review.filter((x) => !subtest || x.subtest === subtest), [review, subtest]);
  const count = (st) => bySub.filter((x) => st === 'semua' || x.status === st).length;
  const shown = bySub.filter((x) => status === 'semua' || x.status === status);
  const totalPages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const pageItems = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => setPage(1), [status, subtest]);

  return (
    <Panel padding="none" className="mt-4 scroll-mt-24" id="pembahasan">
      <div className="flex flex-col gap-4 border-b border-mist-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Pembahasan</h2>
          <p className="mt-1 text-sm text-mist-700">Bandingkan jawaban Anda dengan kunci dan pelajari penjelasannya.</p>
        </div>
        <div className="flex flex-col gap-2 print:hidden sm:flex-row sm:flex-wrap sm:items-center">
          <Segmented
            size="sm"
            ariaLabel="Filter subtes"
            value={subtest}
            onChange={setSubtest}
            items={[{ value: '', label: 'Semua subtes' }, ...subtests.map((c) => ({ value: c, label: c }))]}
          />
        <Segmented
          size="sm"
          ariaLabel="Filter status jawaban"
          value={status}
          onChange={setStatus}
          items={[
            { value: 'semua', label: 'Semua', count: count('semua') },
            { value: 'benar', label: 'Benar', count: count('benar') },
            { value: 'salah', label: 'Salah', count: count('salah') },
            { value: 'kosong', label: 'Kosong', count: count('kosong') },
          ]}
        />
        </div>
      </div>
      <div className="p-5 sm:p-6">

      {!pageItems.length ? (
        <EmptyState size="sm" title="Tidak ada soal" description="Tidak ada soal yang cocok dengan filter ini." variant="dashed" />
      ) : (
        <ol className="space-y-4">
          {pageItems.map((x) => (
            <ReviewItem key={x.question_id} x={x} />
          ))}
        </ol>
      )}
      {totalPages > 1 && (
        <div className="mt-6 print:hidden">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={shown.length}
            perPage={PER_PAGE}
            onChange={(p) => {
              setPage(p);
              document.getElementById('pembahasan')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        </div>
      )}
      </div>
    </Panel>
  );
}

function ReviewItem({ x }) {
  const isTKP = x.subtest === 'TKP';
  const maxW = Math.max(...x.options.map((o) => Number(o.weight) || 0));
  return (
    <li className="rounded-2xl p-5 ring-1 ring-inset ring-mist-100 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-ghost px-2 font-mono text-sm font-semibold tabular-nums text-obsidian ring-1 ring-inset ring-mist-100">{String(x.position).padStart(2, '0')}</span>
        <Chip color={SUBTEST_COLOR[x.subtest]} size="sm">
          {x.subtest}
        </Chip>
        {x.category_name && (
          <Chip color="mist" size="sm">
            {x.category_name}
          </Chip>
        )}
        <span className="ml-auto flex items-center gap-2">
          <span className="font-mono text-xs font-semibold tabular-nums text-obsidian-600">
            {formatAngka(x.score)}/{x.max_weight} poin
          </span>
          <Badge status={x.status} size="sm" />
        </span>
      </div>
      <p className="mt-4 whitespace-pre-line text-[16px] leading-relaxed">{x.body}</p>
      {x.image_url && <img src={x.image_url} alt={`Gambar soal ${x.position}`} className="mt-4 max-h-72 rounded-2xl bg-ghost object-contain" />}
      <div className="mt-5 space-y-2.5">
        {x.options.map((o) => {
          const chosen = o.id === x.chosen_option_id;
          const best = (Number(o.weight) || 0) === maxW && maxW > 0;
          const state = best ? 'correct' : chosen ? (isTKP ? 'selected' : 'wrong') : 'muted';
          const note = chosen ? (
            <span className={best ? 'text-mint-700' : isTKP ? 'text-cobalt-700' : 'text-danger-700'}>Jawaban Anda</span>
          ) : best ? (
            <span className="text-mint-700">{isTKP ? 'Bobot tertinggi' : 'Kunci jawaban'}</span>
          ) : null;
          return (
            <OptionButton
              key={o.id}
              label={o.label}
              body={o.body}
              state={state}
              note={note}
              trailing={isTKP ? <span className={cn('rounded-lg px-2 py-1 font-mono text-xs font-semibold', best ? 'bg-mint text-obsidian' : 'bg-ghost text-obsidian-600')}>{o.weight}</span> : null}
            />
          );
        })}
      </div>
      {x.status === 'kosong' && <p className="mt-3 text-sm font-medium text-mist-700">Soal ini tidak dijawab.</p>}
      {x.explanation && (
        <div className="mt-5 rounded-xl bg-ghost p-4 sm:p-5">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-warning-700" aria-hidden />
            Pembahasan
          </p>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-obsidian-600">{x.explanation}</p>
        </div>
      )}
    </li>
  );
}

export default HasilView;
