'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Bookmark, CheckCircle2, Download, Eye, History, Search, Timer, Trash2, TrendingUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api, errorMessage } from '@/lib/api';
import { formatAngka, formatDurasi, formatJam, formatTanggal } from '@/lib/format';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  LineChart,
  Pagination,
  Skeleton,
  Table,
  TableContainer,
  TableEmpty,
  TableSkeleton,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
} from '@/components/ui';
import { fetchAllPages, useResource } from '@/components/peserta/hooks';
import { downloadCsv, shortCode } from '@/components/peserta/constants';
import { DeltaPill, PageHead, Panel, PanelHeader, SearchField, Segmented, StatTile, ThinBar } from '../_components/kit';

const PER_PAGE = 8;

export function RiwayatView() {
  const router = useRouter();
  const toast = useToast();
  const res = useResource(() => fetchAllPages('/me/results'), []);
  const [tab, setTab] = useState('semua');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(null);

  const all = useMemo(() => res.data || [], [res.data]);
  const term = q.trim().toLowerCase();
  const filtered = all
    .filter((r) => (tab === 'lulus' ? r.passed : tab === 'gagal' ? !r.passed : tab === 'disimpan' ? r.saved : true))
    .filter((r) => !term || String(r.package_title || '').toLowerCase().includes(term));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const trend = useMemo(
    () =>
      [...all]
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .slice(-12)
        .map((r) => ({ label: formatTanggal(r.created_at, 'day-month'), value: r.score_total, title: r.package_title })),
    [all],
  );
  const avg = all.length ? all.reduce((s, r) => s + r.score_total, 0) / all.length : 0;
  const best = all.reduce((m, r) => Math.max(m, r.score_total), 0);
  const passed = all.filter((r) => r.passed).length;
  const lastTwo = trend.slice(-2);
  const lastDelta = lastTwo.length === 2 ? lastTwo[1].value - lastTwo[0].value : null;
  const loadingAll = res.loading && !res.data;

  const exportCsv = () => {
    if (!filtered.length) return;
    downloadCsv(`riwayat-tryout-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Paket', 'Tanggal', 'Durasi (menit)', 'TWK', 'TIU', 'TKP', 'Total', 'Benar', 'Salah', 'Kosong', 'Status'],
      ...filtered.map((r) => [
        r.package_title,
        `${formatTanggal(r.created_at)} ${formatJam(r.created_at)}`,
        Math.round(r.duration_seconds / 60),
        r.score_twk,
        r.score_tiu,
        r.score_tkp,
        r.score_total,
        r.correct_count,
        r.wrong_count,
        r.empty_count,
        r.passed ? 'Lulus' : 'Tidak lulus',
      ]),
    ]);
    toast.success('CSV diunduh', `${filtered.length} baris riwayat diekspor.`);
  };

  const savedCount = all.filter((r) => r.saved).length;

  /** Tandai / batalkan "disimpan" (optimistis). */
  const toggleSave = async (r) => {
    const next = !r.saved;
    setBusy(r.attempt_id);
    res.setData((list) => list.map((x) => (x.attempt_id === r.attempt_id ? { ...x, saved: next } : x)));
    try {
      await api.patch(`/me/results/${r.attempt_id}`, { saved: next });
      toast.success(next ? 'Hasil disimpan' : 'Batal disimpan', r.package_title);
    } catch (err) {
      res.setData((list) => list.map((x) => (x.attempt_id === r.attempt_id ? { ...x, saved: !next } : x)));
      toast.error('Gagal menyimpan', errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  /** Hapus dari riwayat (disembunyikan di server; laporan admin tetap utuh). */
  const removeResult = async () => {
    const r = toDelete;
    try {
      await api.del(`/me/results/${r.attempt_id}`);
      res.setData((list) => list.filter((x) => x.attempt_id !== r.attempt_id));
      toast.success('Hasil dihapus', r.package_title);
      return true;
    } catch (err) {
      toast.error('Gagal menghapus', errorMessage(err));
      return false;
    }
  };

  const changeTab = (v) => {
    setTab(v);
    setPage(1);
  };
  const changeQ = (v) => {
    setQ(v);
    setPage(1);
  };

  return (
    <>
      <PageHead
        crumbs={[{ href: '/dashboard', label: 'Dashboard' }, { label: 'Riwayat' }]}
        title="Riwayat ujian"
        mascot="/maskot/riwayat.webp"
        description="Semua tryout yang sudah Anda kumpulkan, lengkap dengan skor per subtes."
        actions={
          <>
            <Button variant="secondary" icon={<Download />} onClick={exportCsv} disabled={!filtered.length}>
              Ekspor CSV
            </Button>
            <Button icon={<Timer />} href="/tryout">
              Ikuti tryout
            </Button>
          </>
        }
      />

      {res.error && !res.data ? (
        <Panel padding="none">
          <ErrorState error={res.error} onRetry={() => res.reload()} title="Riwayat gagal dimuat" />
        </Panel>
      ) : (
        <>
          {/* Ringkasan + tren skor */}
          <div className="grid gap-4 xl:grid-cols-12 [&>*]:min-w-0">
            <div className="grid gap-4 sm:grid-cols-3 xl:col-span-5 xl:grid-cols-1">
              <StatTile
                loading={loadingAll}
                title="Rata-rata skor"
                info="Rata-rata skor total semua tryout yang dikumpulkan (maks 550)."
                icon={TrendingUp}
                value={formatAngka(avg, { maxDecimals: 1 })}
                suffix="/550"
                pill={lastDelta != null ? <DeltaPill value={lastDelta} title="Selisih dua tryout terakhir" /> : null}
                chart={<ThinBar value={avg} max={550} label="Rata-rata skor dari 550" />}
              />
              <StatTile loading={loadingAll} title="Skor terbaik" info="Skor total tertinggi Anda." icon={Trophy} value={formatAngka(best)} suffix="/550" caption={all.length ? `Dari ${all.length} tryout` : 'Belum ada tryout'} />
              <StatTile
                loading={loadingAll}
                title="Lulus passing grade"
                info="Jumlah tryout yang memenuhi semua passing grade."
                icon={CheckCircle2}
                value={`${passed}/${all.length}`}
                pill={all.length ? <DeltaPill value={passed} text={`${Math.round((passed / all.length) * 100)}%`} /> : null}
                caption="tryout lulus"
              />
            </div>
            <Panel className="xl:col-span-7">
              <PanelHeader title="Tren skor total" info="Skor total hingga 12 tryout terakhir." subtitle="Hingga 12 tryout terakhir" />
              {loadingAll ? (
                <Skeleton className="h-[260px] w-full" rounded="rounded-2xl" />
              ) : (
                <LineChart
                  data={trend}
                  series={[{ key: 'value', label: 'Skor total' }]}
                  height={260}
                  defaultActive={trend.length - 1}
                  formatValue={(v) => formatAngka(v)}
                  emptyText="Belum ada data tryout"
                  ariaLabel="Grafik tren skor total"
                />
              )}
            </Panel>
          </div>

          {/* Tabel */}
          <Panel padding="none" className="mt-4 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-mist-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-[14px] font-semibold sm:text-[15px]">Daftar hasil</h2>
                {res.data && <span className="rounded-md bg-ghost px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-mist-700">{filtered.length}</span>}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchField value={q} onChange={changeQ} placeholder="Cari nama paket…" className="sm:w-64" />
              <Segmented
                ariaLabel="Filter status"
                size="sm"
                value={tab}
                onChange={changeTab}
                items={[
                  { value: 'semua', label: 'Semua', count: res.data ? all.length : undefined },
                  { value: 'lulus', label: 'Lulus', count: res.data ? passed : undefined },
                  { value: 'gagal', label: 'Tidak lulus', count: res.data ? all.length - passed : undefined },
                  { value: 'disimpan', label: 'Disimpan', count: res.data ? savedCount : undefined },
                ]}
              />
              </div>
            </div>

            {/* Desktop/tablet: tabel */}
            <div className="hidden md:block [&_table]:min-w-full">
              <TableContainer>
                <Table>
                  <THead>
                    <Tr>
                      <Th>Paket</Th>
                      <Th>Tanggal</Th>
                      <Th>Durasi</Th>
                      <Th align="right">TWK</Th>
                      <Th align="right">TIU</Th>
                      <Th align="right">TKP</Th>
                      <Th align="right">Total</Th>
                      <Th>Status</Th>
                      <Th align="right" width={132}>
                        <span className="sr-only">Aksi</span>
                      </Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {res.loading && !res.data ? (
                      <TableSkeleton rows={5} cols={9} />
                    ) : !rows.length ? (
                      <TableEmpty colSpan={9}>
                        <EmptyRows tab={tab} searching={!!term} />
                      </TableEmpty>
                    ) : (
                      rows.map((r) => (
                        <Tr key={r.attempt_id} onClick={() => router.push(`/hasil/${r.attempt_id}`)}>
                          <Td>
                            <p className="flex items-center gap-1.5 font-semibold text-obsidian">
                              {r.package_title}
                              {r.saved && <Bookmark className="h-3.5 w-3.5 fill-cobalt text-cobalt" aria-label="Disimpan" />}
                            </p>
                            <p className="font-mono text-xs text-mist-700">{shortCode(r.attempt_id)}</p>
                          </Td>
                          <Td nowrap>
                            <p>{formatTanggal(r.created_at)}</p>
                            <p className="text-xs text-mist-700">{formatJam(r.created_at)} WIB</p>
                          </Td>
                          <Td nowrap>
                            <span className="rounded-md bg-ghost px-2 py-1 font-mono text-xs font-medium">{formatDurasi(r.duration_seconds)}</span>
                          </Td>
                          <Td align="right" mono>
                            {r.score_twk}
                          </Td>
                          <Td align="right" mono>
                            {r.score_tiu}
                          </Td>
                          <Td align="right" mono>
                            {r.score_tkp}
                          </Td>
                          <Td align="right">
                            <span className="text-base font-semibold tabular-nums">{r.score_total}</span>
                          </Td>
                          <Td>
                            <Badge status={r.passed ? 'lulus' : 'gagal'} />
                          </Td>
                          <Td align="right">
                            <RowActions r={r} busy={busy === r.attempt_id} onSave={() => toggleSave(r)} onDelete={() => setToDelete(r)} />
                          </Td>
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            </div>

            {/* Mobile: daftar kartu */}
            <div className="space-y-3 p-3 sm:p-4 md:hidden">
              {res.loading && !res.data ? (
                [0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full" rounded="rounded-2xl" />)
              ) : !rows.length ? (
                <EmptyRows tab={tab} searching={!!term} />
              ) : (
                rows.map((r) => (
                  <div key={r.attempt_id} className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-mist-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-semibold">
                          {r.saved && <Bookmark className="h-3.5 w-3.5 shrink-0 fill-cobalt text-cobalt" aria-label="Disimpan" />}
                          <span className="truncate text-sm sm:text-base">{r.package_title}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-mist-700">
                          {formatTanggal(r.created_at)} · {formatDurasi(r.duration_seconds)}
                        </p>
                      </div>
                      <Badge status={r.passed ? 'lulus' : 'gagal'} size="sm" />
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      {[
                        ['TWK', r.score_twk],
                        ['TIU', r.score_tiu],
                        ['TKP', r.score_tkp],
                        ['Total', r.score_total],
                      ].map(([l, v], i) => (
                        <div key={l} className={cn('rounded-xl py-2', i === 3 ? 'bg-obsidian text-white' : 'bg-ghost')}>
                          <p className={cn('text-[11px]', i === 3 ? 'text-white/60' : 'text-mist-700')}>{l}</p>
                          <p className="font-mono text-sm font-semibold tabular-nums">{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-mist-100 pt-3 sm:flex sm:items-center sm:justify-between">
                      <RowActions r={r} busy={busy === r.attempt_id} onSave={() => toggleSave(r)} onDelete={() => setToDelete(r)} labels />
                    </div>
                  </div>
                ))
              )}
            </div>

            {filtered.length > PER_PAGE && (
              <div className="border-t border-mist-100 px-5 py-4 sm:px-6">
                <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onChange={setPage} />
              </div>
            )}
          </Panel>
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={removeResult}
        tone="danger"
        title="Hapus hasil ini dari riwayat?"
        description={toDelete ? `"${toDelete.package_title}" (skor ${toDelete.score_total}) akan hilang dari riwayat, dashboard, dan statistik Anda. Tindakan ini tidak bisa dibatalkan.` : ''}
        confirmText="Ya, hapus"
        icon={<Trash2 className="h-[22px] w-[22px]" />}
      />
    </>
  );
}

/** Tombol aksi baris: lihat · simpan · hapus. labels → tampilkan teks (kartu mobile). */
function RowActions({ r, busy, onSave, onDelete, labels }) {
  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };
  if (labels) {
    return (
      <>
        <Button size="sm" variant="ghost" icon={<Eye />} href={`/hasil/${r.attempt_id}`} className="max-sm:px-2">
          Lihat
        </Button>
        <div className="contents sm:flex sm:items-center sm:gap-1">
          <Button size="sm" variant={r.saved ? 'soft' : 'ghost'} icon={<Bookmark className={cn(r.saved && 'fill-cobalt text-cobalt')} />} onClick={onSave} disabled={busy} aria-pressed={r.saved} className="max-sm:px-2">
            {r.saved ? 'Disimpan' : 'Simpan'}
          </Button>
          <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={onDelete} className="text-danger-700 max-sm:px-2">
            Hapus
          </Button>
        </div>
      </>
    );
  }
  return (
    <div className="flex items-center justify-end gap-0.5">
      <IconButton
        icon={<Bookmark className={cn(r.saved && 'fill-cobalt text-cobalt')} />}
        label={r.saved ? `Batal simpan ${r.package_title}` : `Simpan ${r.package_title}`}
        title={r.saved ? 'Batal simpan' : 'Simpan'}
        variant="ghost"
        size="sm"
        aria-pressed={r.saved}
        disabled={busy}
        onClick={stop(onSave)}
      />
      <IconButton icon={<Eye />} label={`Lihat hasil ${r.package_title}`} title="Lihat" variant="ghost" size="sm" href={`/hasil/${r.attempt_id}`} onClick={(e) => e.stopPropagation()} />
      <IconButton icon={<Trash2 />} label={`Hapus hasil ${r.package_title}`} title="Hapus" variant="ghost" size="sm" className="hover:!bg-danger-50 hover:!text-danger-700" onClick={stop(onDelete)} />
    </div>
  );
}

function EmptyRows({ tab, searching }) {
  const fresh = tab === 'semua' && !searching;
  return (
    <EmptyState
      size="sm"
      icon={fresh ? <History /> : searching ? <Search /> : <Timer />}
      title={fresh ? 'Belum ada riwayat' : tab === 'disimpan' && !searching ? 'Belum ada hasil yang disimpan' : 'Tidak ada hasil pada filter ini'}
      description={
        fresh
          ? 'Selesaikan tryout pertama Anda untuk melihat riwayat di sini.'
          : tab === 'disimpan' && !searching
            ? 'Tekan ikon simpan pada hasil yang ingin Anda tandai.'
            : 'Coba ubah kata kunci atau pilih filter lain.'
      }
      action={
        fresh ? (
          <Button size="sm" href="/tryout" iconRight={<ArrowRight />}>
            Pilih tryout
          </Button>
        ) : null
      }
    />
  );
}

export default RiwayatView;
