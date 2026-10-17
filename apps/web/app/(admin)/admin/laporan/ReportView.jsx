'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, BarChart3, Clock3, Download, FileStack, Gauge as GaugeIcon, Settings2, Trophy, Users } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { excerpt, formatAngka, formatPersen, formatTanggalJam } from '@/lib/format';
import {
  Avatar,
  BarChart,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  ProgressBar,
  Select,
  Skeleton,
  Table,
  TableContainer,
  TableEmpty,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
} from '@/components/ui';
import { SubtestChip } from '@/components/admin/AdminParts';
import { AdminPageHeader, IconBox, Panel, PanelHeader, StatTile, StatusPill, TableSkin, ThinProgress } from '@/components/admin/AdminUI';
import { Segmented } from '@/components/admin/Segmented';
import { SUBTESTS, SUBTEST_MAX, useResource } from '@/components/admin/shared';

export function ReportView() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const paramId = params.get('paket') || '';
  const pkgs = useResource(() => api.list('/admin/packages', { query: { per_page: 100 } }), []);
  const packages = useMemo(() => pkgs.data || [], [pkgs.data]);
  const [rankFilter, setRankFilter] = useState('semua');
  const [itemFilter, setItemFilter] = useState('semua');
  const [itemSub, setItemSub] = useState('');
  const [exporting, setExporting] = useState(false);

  // Default: paket dengan peserta terbanyak.
  const selectedId = paramId || (packages.length ? [...packages].sort((a, b) => b.attempts_count - a.attempts_count)[0].id : '');
  useEffect(() => {
    if (!paramId && selectedId) router.replace(`${pathname}?paket=${selectedId}`, { scroll: false });
  }, [paramId, selectedId, pathname, router]);

  const rep = useResource(() => (selectedId ? api.get(`/admin/reports/packages/${selectedId}`) : Promise.resolve(null)), [selectedId]);
  const r = rep.data;
  const p = r?.package;
  const s = r?.summary || {};

  const ranking = (r?.ranking || []).filter((x) => rankFilter === 'semua' || (rankFilter === 'lulus' ? x.passed : !x.passed));
  const items = (r?.items || []).filter((x) => (!itemSub || x.subtest === itemSub) && (itemFilter === 'semua' || x.flag === itemFilter));
  const flagCounts = useMemo(() => {
    const all = r?.items || [];
    return { mudah: all.filter((x) => x.flag === 'terlalu_mudah').length, sulit: all.filter((x) => x.flag === 'terlalu_sulit').length };
  }, [r]);

  const select = (id) => {
    setRankFilter('semua');
    setItemFilter('semua');
    setItemSub('');
    router.replace(`${pathname}?paket=${id}`, { scroll: false });
  };

  const doExport = async () => {
    setExporting(true);
    try {
      await api.download(`/admin/reports/packages/${selectedId}/export`);
      toast.success('Ekspor dimulai', 'Laporan paket sedang diunduh.');
    } catch (err) {
      toast.error('Gagal mengekspor', errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const passMap = p ? { TWK: p.pass_twk, TIU: p.pass_tiu, TKP: p.pass_tkp } : {};
  const avgMap = { TWK: s.avg_twk, TIU: s.avg_tiu, TKP: s.avg_tkp };
  const subMax = p ? Object.fromEntries(SUBTESTS.map((k) => [k, (p.counts?.[k] || 0) * 5])) : SUBTEST_MAX;

  return (
    <div>
      <AdminPageHeader
        title="Laporan"
        description="Rekap hasil per paket, distribusi skor, peringkat, dan analisis butir soal."
        actions={
          <>
            <Select
              aria-label="Pilih paket"
              value={selectedId}
              onChange={(e) => select(e.target.value)}
              disabled={pkgs.loading}
              leftIcon={<FileStack />}
              options={packages.map((x) => ({ value: x.id, label: `${x.title}${x.status !== 'terbit' ? ` (${x.status})` : ''}` }))}
              placeholder={pkgs.loading ? 'Memuat paket…' : packages.length ? undefined : 'Belum ada paket'}
              wrapperClassName="w-full sm:w-80"
            />
            <Button icon={<Download />} onClick={doExport} loading={exporting} disabled={!r || !s.participants}>
              Ekspor CSV
            </Button>
          </>
        }
      />

      {pkgs.error || rep.error ? (
        <Panel padding="none">
          <ErrorState error={pkgs.error || rep.error} onRetry={() => (pkgs.error ? pkgs.reload() : rep.reload())} />
        </Panel>
      ) : !pkgs.loading && !packages.length ? (
        <EmptyState variant="dashed" icon={<FileStack />} title="Belum ada paket ujian" description="Buat paket dan terbitkan agar peserta dapat mengerjakannya." action={<Button href="/admin/paket?baru=1">Buat paket</Button>} />
      ) : !r ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StatTile key={i} title="Memuat…" icon={<BarChart3 />} loading compact className={i === 4 ? 'max-sm:col-span-2' : undefined} />
            ))}
          </div>
          <Skeleton className="h-64" rounded="rounded-[20px]" />
        </div>
      ) : (
        <div className={cn('space-y-3 sm:space-y-4 transition-opacity', rep.loading && 'opacity-60')}>
          <Panel padding="sm" tone="ghost" className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <IconBox icon={<FileStack />} size="lg" className="!bg-white max-sm:hidden" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[14px] font-semibold tracking-[-0.01em] sm:text-[16px]">
                {p.title} <StatusPill status={p.status} />
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip size="sm" color="warning" icon={<Clock3 />} mono>
                  {p.duration_minutes} menit
                </Chip>
                <Chip size="sm" color="mist" icon={<FileStack />}>
                  {p.question_count} soal
                </Chip>
                <Chip size="sm" color="mint" icon={<GaugeIcon />} mono>
                  PG {p.pass_twk}/{p.pass_tiu}/{p.pass_tkp}
                  {p.pass_total ? `/${p.pass_total}` : ''}
                </Chip>
              </div>
            </div>
            <Button variant="secondary" size="sm" icon={<Settings2 />} href={`/admin/paket/${p.id}`}>
              Kelola paket
            </Button>
          </Panel>

          <section aria-label="Ringkasan" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
            <StatTile compact title="Peserta" info="Jumlah ujian selesai untuk paket ini" icon={<Users />} value={formatAngka(s.participants)} caption="Ujian selesai" />
            <StatTile compact title="Rata-rata" info="Rata-rata skor total" icon={<BarChart3 />} value={formatAngka(s.avg_total, { maxDecimals: 1 })} suffix="/550" chart={<ThinProgress value={s.avg_total || 0} max={550} label="Rata-rata dari 550" className="mb-1" />} />
            <StatTile compact title="Tertinggi" info="Skor total tertinggi" icon={<ArrowUpWideNarrow />} tone="mint" value={formatAngka(s.max_total)} caption="Skor total terbaik" />
            <StatTile compact title="Terendah" info="Skor total terendah" icon={<ArrowDownWideNarrow />} tone="warning" value={formatAngka(s.min_total)} caption="Skor total terendah" />
            <StatTile
              title="Tingkat lulus"
              info="Persentase peserta yang lulus semua ambang"
              icon={<Trophy />}
              tone="mint"
              compact
              value={formatPersen(s.pass_rate, { decimals: 1 })}
              caption={`${(r.ranking || []).filter((x) => x.passed).length} dari ${s.participants} peserta`}
              className="col-span-2 xl:col-span-1"
            />
          </section>

          <div className="grid gap-3 sm:gap-4 lg:grid-cols-12">
            <Panel padding="lg" className="lg:col-span-7">
              <PanelHeader title="Distribusi skor total" info="Jumlah peserta per rentang skor" subtitle="Jumlah peserta per rentang skor" />
              {s.participants ? (
                /* Mobile: label rentang skor tidak muat di 6 kolom → grafik digulir horizontal di dalam kartu. */
                <div className="max-sm:-mx-4 max-sm:overflow-x-auto max-sm:px-4 max-sm:pb-2">
                  <div className="max-sm:min-w-[420px]">
                    <BarChart data={r.distribution || []} xKey="range" series={[{ key: 'count', label: 'Peserta' }]} height={260} ariaLabel="Distribusi skor" formatY={(v) => (Number.isInteger(v) ? v : '')} formatValue={(v) => `${v} peserta`} />
                  </div>
                </div>
              ) : (
                <EmptyState size="sm" icon={<BarChart3 />} title="Belum ada hasil" description="Distribusi tampil setelah peserta menyelesaikan paket ini." />
              )}
            </Panel>
            <Panel padding="lg" className="lg:col-span-5">
              <PanelHeader title="Rata-rata per subtes" info="Garis vertikal menandai passing grade" subtitle="Garis vertikal = passing grade" />
              <div className="space-y-6">
                {SUBTESTS.map((k) => (
                  <div key={k}>
                    <div className="mb-2 flex items-center justify-between">
                      <SubtestChip code={k} />
                      <span className="text-sm">
                        <span className="font-semibold tabular-nums">{formatAngka(avgMap[k], { maxDecimals: 1 })}</span>
                        <span className="text-mist-500"> / {subMax[k] || 0}</span>
                      </span>
                    </div>
                    <ProgressBar
                      value={avgMap[k] || 0}
                      max={subMax[k] || 1}
                      marker={subMax[k] ? passMap[k] : null}
                      size="lg"
                      color={subMax[k] && (avgMap[k] || 0) >= passMap[k] ? 'mint-dark' : 'cobalt'}
                    />
                    <p className="mt-1.5 text-xs text-mist-700">
                      {subMax[k] ? `Passing grade ${passMap[k]} · ${(avgMap[k] || 0) >= passMap[k] ? 'rata-rata di atas ambang' : 'rata-rata di bawah ambang'}` : 'Tidak ada soal subtes ini'}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel padding="none" className="overflow-hidden">
            <div className="flex flex-col gap-3 p-4 sm:p-5 sm:pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[14px] font-semibold tracking-[-0.01em] sm:text-[15px]">Peringkat peserta</h2>
                <p className="mt-0.5 text-[13px] text-mist-700">Diurutkan dari skor total tertinggi.</p>
              </div>
              <Segmented
                size="sm"
                value={rankFilter}
                onChange={setRankFilter}
                ariaLabel="Filter peringkat"
                options={[
                  { value: 'semua', label: 'Semua', count: r.ranking?.length || 0 },
                  { value: 'lulus', label: 'Lulus' },
                  { value: 'gagal', label: 'Tidak lulus' },
                ]}
              />
            </div>
            <TableSkin>
              <TableContainer maxHeight={480} className="!rounded-none">
                <Table>
                  <THead>
                    <Tr>
                      <Th width={70}>#</Th>
                      <Th>Peserta</Th>
                      <Th align="right">TWK</Th>
                      <Th align="right">TIU</Th>
                      <Th align="right">TKP</Th>
                      <Th align="right">Total</Th>
                      <Th>Status</Th>
                      <Th>Selesai</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {!ranking.length ? (
                      <TableEmpty colSpan={8}>
                        <EmptyState size="sm" icon={<Trophy />} title={r.ranking?.length ? 'Tidak ada peserta dengan filter ini' : 'Belum ada peserta yang menyelesaikan paket'} />
                      </TableEmpty>
                    ) : (
                      ranking.map((x) => (
                        <Tr key={x.attempt_id}>
                          <Td>
                            <span className={cn('inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 font-mono text-xs font-semibold', x.rank === 1 ? 'bg-mint text-obsidian' : x.rank <= 3 ? 'bg-obsidian text-white' : 'bg-ghost text-obsidian-600')}>
                              {x.rank}
                            </span>
                          </Td>
                          <Td>
                            <span className="flex items-center gap-3">
                              <Avatar name={x.user_name} size="sm" />
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{x.user_name}</span>
                                <span className="block truncate text-xs text-mist-700">{x.email}</span>
                              </span>
                            </span>
                          </Td>
                          {[
                            ['score_twk', p.pass_twk],
                            ['score_tiu', p.pass_tiu],
                            ['score_tkp', p.pass_tkp],
                          ].map(([k, pg]) => (
                            <Td key={k} align="right" mono className={cn('text-[13px]', x[k] < pg ? 'text-danger-700' : 'text-obsidian')}>
                              {x[k]}
                            </Td>
                          ))}
                          <Td align="right" className="text-sm font-semibold tabular-nums sm:text-base">
                            {formatAngka(x.score_total)}
                          </Td>
                          <Td>
                            <StatusPill status={x.passed ? 'lulus' : 'gagal'} />
                          </Td>
                          <Td muted nowrap className="text-[13px]">
                            {formatTanggalJam(x.created_at, { wib: false })}
                          </Td>
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            </TableSkin>
          </Panel>

          <Panel padding="none" className="overflow-hidden">
            <div className="flex flex-col gap-3 p-4 sm:p-5 sm:pb-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-[14px] font-semibold tracking-[-0.01em] sm:text-[15px]">Analisis butir soal</h2>
                <p className="mt-0.5 text-[13px] text-mist-700">Persentase peserta yang menjawab benar. ≥ 90% terlalu mudah, ≤ 20% terlalu sulit.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Segmented
                  size="sm"
                  value={itemSub}
                  onChange={setItemSub}
                  ariaLabel="Filter subtes"
                  options={[{ value: '', label: 'Semua' }, ...SUBTESTS.filter((k) => p.counts?.[k]).map((k) => ({ value: k, label: k }))]}
                />
                <Segmented
                  size="sm"
                  value={itemFilter}
                  onChange={setItemFilter}
                  ariaLabel="Filter kategori butir"
                  options={[
                    { value: 'semua', label: 'Semua' },
                    { value: 'terlalu_mudah', label: 'Terlalu mudah', count: flagCounts.mudah },
                    { value: 'terlalu_sulit', label: 'Terlalu sulit', count: flagCounts.sulit },
                  ]}
                />
              </div>
            </div>
            <TableSkin>
              <TableContainer maxHeight={560} className="!rounded-none">
                <Table className="min-w-[760px]">
                  <THead>
                    <Tr>
                      <Th width={64}>No</Th>
                      <Th width={80}>Subtes</Th>
                      <Th>Cuplikan soal</Th>
                      <Th align="right">Dijawab</Th>
                      <Th align="right">Benar</Th>
                      <Th width={200}>% benar</Th>
                      <Th>Catatan</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {!items.length ? (
                      <TableEmpty colSpan={7}>
                        <EmptyState size="sm" title={r.items?.length ? 'Tidak ada butir dengan filter ini' : 'Belum ada butir soal'} />
                      </TableEmpty>
                    ) : (
                      items.map((it) => (
                        <Tr key={it.question_id}>
                          <Td mono className="text-xs font-semibold text-mist-700">
                            {it.position}
                          </Td>
                          <Td>
                            <SubtestChip code={it.subtest} />
                          </Td>
                          <Td className="max-w-[360px]">
                            <span className="line-clamp-1" title={it.body}>
                              {excerpt(it.body, 110)}
                            </span>
                          </Td>
                          <Td align="right" className="tabular-nums">
                            {formatAngka(it.answered)}
                          </Td>
                          <Td align="right" className="tabular-nums">
                            {formatAngka(it.correct)}
                          </Td>
                          <Td>
                            <div className="flex items-center gap-3">
                              <ProgressBar
                                value={it.pct_correct}
                                size="sm"
                                color={it.flag === 'terlalu_mudah' ? 'mint-dark' : it.flag === 'terlalu_sulit' ? 'danger' : 'cobalt'}
                                className="flex-1"
                              />
                              <span className="w-11 text-right text-xs font-semibold tabular-nums">{it.answered ? formatPersen(it.pct_correct) : '—'}</span>
                            </div>
                          </Td>
                          <Td>
                            {it.flag === 'terlalu_mudah' ? (
                              <StatusPill tone="mint">Terlalu mudah</StatusPill>
                            ) : it.flag === 'terlalu_sulit' ? (
                              <StatusPill tone="danger">Terlalu sulit</StatusPill>
                            ) : (
                              <span className="text-xs text-mist-500">—</span>
                            )}
                          </Td>
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            </TableSkin>
          </Panel>
        </div>
      )}
    </div>
  );
}

export default ReportView;
