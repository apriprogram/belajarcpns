'use client';

import Link from 'next/link';
import { Activity, BookOpenCheck, FileStack, FileUp, LibraryBig, Plus, Radio, Target, Trophy, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAngka, formatPersen, formatRelatif } from '@/lib/format';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Avatar,
  BarChart,
  Button,
  ChartLegend,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonText,
  Table,
  TableContainer,
  TableEmpty,
  TableSkeleton,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/ui';
import { CompositionBar } from '@/components/admin/AdminParts';
import {
  AdminPageHeader,
  DeltaPill,
  DetailButton,
  IconBox,
  MeterBars,
  MiniBars,
  Panel,
  PanelHeader,
  Sparkline,
  StatTile,
  StatusPill,
  TableSkin,
  ThinProgress,
} from '@/components/admin/AdminUI';
import { SUBTESTS, SUBTEST_BG, SUBTEST_NAME, useResource } from '@/components/admin/shared';

const sum = (arr, k) => arr.reduce((a, d) => a + (Number(d[k]) || 0), 0);

export function DashboardView() {
  const { user } = useAuth();
  const { loading, error, data, reload } = useResource(() => api.get('/admin/dashboard'), []);
  const t = data?.totals || {};
  const activity = data?.activity || [];
  const last7 = activity.slice(-7);
  const prev7 = activity.slice(-14, -7);
  const sum14 = { attempts: sum(activity, 'attempts'), registrations: sum(activity, 'registrations') };
  const reg7 = sum(last7, 'registrations');
  const att7 = sum(last7, 'attempts');
  const attPrev7 = sum(prev7, 'attempts');
  const attChange = attPrev7 ? Math.round(((att7 - attPrev7) / attPrev7) * 100) : null;
  const bySub = data?.by_subtest || {};
  const bankTotal = SUBTESTS.reduce((a, k) => a + (bySub[k] || 0), 0);
  const legend = [
    { label: 'Ujian', color: '#3765F6' },
    { label: 'Pendaftaran', color: '#C3CED7' },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description={`Halo, ${(user?.name || 'Admin').split(' ')[0]} — ringkasan metrik utama dan aktivitas platform BISA-PNS.`}
        actions={
          <>
            <Button variant="secondary" icon={<FileUp />} href="/admin/soal?import=1">
              Import CSV
            </Button>
            <Button variant="secondary" icon={<FileStack />} href="/admin/paket?baru=1">
              Buat paket
            </Button>
            <Button icon={<Plus />} href="/admin/soal/baru">
              Tambah soal
            </Button>
          </>
        }
      />

      {error ? (
        <Panel padding="none">
          <ErrorState error={error} onRetry={() => reload()} />
        </Panel>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-12">
            {/* Kartu statistik 2×2 */}
            <section aria-label="Statistik utama" className="grid gap-4 sm:grid-cols-2 xl:col-span-7">
              <StatTile
                title="Peserta"
                info="Jumlah akun peserta terdaftar"
                href="/admin/peserta"
                icon={<Users />}
                value={formatAngka(t.peserta)}
                delta={reg7 ? `+${formatAngka(reg7)}` : null}
                caption={
                  <>
                    <span className="font-semibold text-obsidian">{formatAngka(reg7)}</span> pendaftar baru dalam 7 hari terakhir
                  </>
                }
                chart={<Sparkline values={activity.map((d) => d.registrations || 0)} label="Tren pendaftaran 14 hari" />}
                loading={loading}
              />
              <StatTile
                title="Ujian hari ini"
                info="Ujian yang diselesaikan peserta hari ini"
                href="/admin/laporan"
                icon={<BookOpenCheck />}
                value={formatAngka(t.attempts_today)}
                delta={att7 ? `+${formatAngka(att7)}` : null}
                caption={
                  <>
                    <span className="font-semibold text-obsidian">{formatAngka(t.attempts)}</span> ujian selesai sepanjang waktu
                  </>
                }
                chart={<MiniBars values={activity.map((d) => d.attempts || 0)} label="Ujian per hari, 14 hari" />}
                loading={loading}
              />
              <StatTile
                title="Online sekarang"
                info="Peserta dengan aktivitas dalam 5 menit terakhir"
                href="/admin/peserta"
                icon={<Radio />}
                tone="mint"
                value={formatAngka(t.online)}
                caption={
                  <>
                    <span className="font-semibold text-obsidian">{formatAngka(t.active_today)}</span> peserta aktif hari ini
                  </>
                }
                chart={<MeterBars value={t.active_today || 0} max={Math.max(1, t.peserta || 0)} label={`${t.active_today || 0} dari ${t.peserta || 0} peserta aktif hari ini`} />}
                loading={loading}
              />
              <StatTile
                title="Rata-rata skor"
                info="Rata-rata skor total SKD dari semua ujian selesai (maks. 550)"
                href="/admin/laporan"
                icon={<Target />}
                value={formatAngka(t.avg_score, { maxDecimals: 1 })}
                suffix="/550"
                delta={t.pass_rate != null ? `${formatPersen(t.pass_rate, { decimals: 0 })} lulus` : null}
                caption={
                  <>
                    Tingkat kelulusan <span className="font-semibold text-obsidian">{formatPersen(t.pass_rate, { decimals: 1 })}</span>
                  </>
                }
                chart={<ThinProgress value={t.avg_score || 0} max={550} label="Rata-rata skor dari 550" className="mb-1" />}
                loading={loading}
              />
            </section>

            {/* Grafik aktivitas */}
            <Panel className="flex flex-col xl:col-span-5">
              <PanelHeader title="Aktivitas 14 hari" info="Ujian selesai dan pendaftaran peserta baru per hari" action={<DetailButton href="/admin/laporan" label="Detail laporan" />} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconBox icon={<Activity />} />
                  <p className="text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{loading ? '—' : formatAngka(sum14.attempts)}</p>
                  {!loading && attChange != null && (
                    <DeltaPill tone={attChange < 0 ? 'danger' : 'mint'}>
                      {attChange > 0 ? '+' : ''}
                      {attChange}%
                    </DeltaPill>
                  )}
                </div>
                <ChartLegend items={legend} />
              </div>
              <p className="mt-2 text-xs text-mist-700">
                Ujian selesai · <span className="font-semibold text-obsidian">{loading ? '—' : formatAngka(sum14.registrations)}</span> pendaftaran baru
              </p>
              <div className="mt-4 flex-1">
                {loading ? (
                  <Skeleton className="h-[220px] w-full" rounded="rounded-xl" />
                ) : (
                  <BarChart
                    data={activity}
                    height={220}
                    ariaLabel="Grafik aktivitas 14 hari"
                    formatY={(v) => (Number.isInteger(v) ? formatAngka(v) : '')}
                    series={[
                      { key: 'attempts', label: 'Ujian' },
                      { key: 'registrations', label: 'Pendaftaran' },
                    ]}
                    formatValue={(v) => formatAngka(v)}
                  />
                )}
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-12">
            {/* Hasil terbaru */}
            <Panel padding="none" className="overflow-hidden xl:col-span-8">
              <div className="px-5 pt-5">
                <PanelHeader title="Hasil terbaru" info="Ujian yang baru diselesaikan peserta" action={<DetailButton href="/admin/laporan" label="Lihat semua laporan">Lihat semua</DetailButton>} className="mb-4" />
              </div>
              <TableSkin>
                <TableContainer className="!rounded-none">
                  <Table>
                    <THead>
                      <Tr>
                        <Th>Peserta</Th>
                        <Th>Paket</Th>
                        <Th align="right">Skor</Th>
                        <Th>Status</Th>
                        <Th>Waktu</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {loading ? (
                        <TableSkeleton rows={5} cols={5} />
                      ) : !(data?.recent_results || []).length ? (
                        <TableEmpty colSpan={5}>
                          <EmptyState size="sm" icon={<Trophy />} title="Belum ada hasil ujian" description="Hasil akan muncul setelah peserta menyelesaikan tryout." />
                        </TableEmpty>
                      ) : (
                        data.recent_results.map((r) => (
                          <Tr key={r.attempt_id}>
                            <Td>
                              <span className="flex items-center gap-3">
                                <Avatar name={r.user_name} size="sm" />
                                <span className="whitespace-nowrap font-medium">{r.user_name}</span>
                              </span>
                            </Td>
                            <Td muted className="max-w-[180px] truncate">
                              {r.package_title}
                            </Td>
                            <Td align="right" className="font-semibold tabular-nums">
                              {formatAngka(r.score_total)}
                            </Td>
                            <Td>
                              <StatusPill status={r.passed ? 'lulus' : 'gagal'} />
                            </Td>
                            <Td muted nowrap>
                              {formatRelatif(r.created_at)}
                            </Td>
                          </Tr>
                        ))
                      )}
                    </TBody>
                  </Table>
                </TableContainer>
              </TableSkin>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
              {/* Bank soal */}
              <Panel className="flex flex-col">
                <PanelHeader title="Bank soal" info="Jumlah soal per subtes (terbit dan draf)" action={<DetailButton href="/admin/soal" label="Kelola bank soal" />} />
                {loading ? (
                  <SkeletonText lines={4} />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <IconBox icon={<LibraryBig />} />
                      <p className="text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{formatAngka(bankTotal)}</p>
                      <DeltaPill tone="mist">{formatAngka(t.questions_published)} terbit</DeltaPill>
                    </div>
                    <CompositionBar counts={bySub} showLegend={false} className="mt-4" />
                    <ul className="mt-4 space-y-2.5">
                      {SUBTESTS.map((k) => {
                        const n = bySub[k] || 0;
                        return (
                          <li key={k} className="flex items-center gap-2.5 text-[13px]">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', SUBTEST_BG[k])} aria-hidden />
                            <span className="min-w-0 flex-1 truncate">
                              <span className="font-semibold">{k}</span> <span className="text-mist-700">· {SUBTEST_NAME[k]}</span>
                            </span>
                            <span className="font-semibold tabular-nums">{formatAngka(n)}</span>
                            <span className="w-9 text-right text-xs tabular-nums text-mist-700">{bankTotal ? Math.round((n / bankTotal) * 100) : 0}%</span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </Panel>

              {/* Paket */}
              <Panel className="flex flex-col">
                <PanelHeader title="Paket ujian" info="Paket terbit dan paket dengan ujian terbanyak" action={<DetailButton href="/admin/paket" label="Kelola paket ujian" />} />
                {loading ? (
                  <SkeletonText lines={4} />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <IconBox icon={<FileStack />} />
                      <p className="flex items-baseline gap-1 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                        {formatAngka(t.packages_published)}
                        <span className="text-sm font-medium tracking-normal text-mist-500">/{formatAngka(t.packages)}</span>
                      </p>
                      <DeltaPill tone="mist">terbit</DeltaPill>
                    </div>
                    {!(data?.top_packages || []).length ? (
                      <EmptyState size="sm" title="Belum ada paket" />
                    ) : (
                      <ol className="mt-4 divide-y divide-mist-100">
                        {data.top_packages.slice(0, 3).map((p, i) => (
                          <li key={p.id}>
                            <Link
                              href={`/admin/laporan?paket=${p.id}`}
                              className="group flex items-center gap-3 rounded-lg py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                            >
                              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-semibold', i === 0 ? 'bg-mint text-obsidian' : 'bg-ghost text-obsidian-600')}>
                                {i + 1}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13px] font-semibold group-hover:text-cobalt">{p.title}</span>
                                <span className="block text-xs text-mist-700">
                                  {formatAngka(p.attempts)} ujian · rata-rata {formatAngka(p.avg_score, { maxDecimals: 1 })}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </Panel>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardView;
