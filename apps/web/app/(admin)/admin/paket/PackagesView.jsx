'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Archive, BarChart3, CalendarClock, Clock3, FileStack, FilterX, ListChecks, Plus, Send, Settings2, Shuffle, Trash2, Undo2, Users } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatAngka, formatJam, formatTanggal, formatTanggalJam } from '@/lib/format';
import { Button, Chip, ConfirmDialog, EmptyState, ErrorState, Menu, SearchInput, Skeleton, useToast } from '@/components/ui';
import { AdminPageHeader, Panel, StatusPill } from '@/components/admin/AdminUI';
import { Segmented } from '@/components/admin/Segmented';
import { CompositionBar } from '@/components/admin/AdminParts';
import { PackageFormModal } from '@/components/admin/PackageFormModal';
import { shortCode, useResource } from '@/components/admin/shared';

function scheduleText(p) {
  if (!p.start_at && !p.end_at) return 'Kapan saja';
  if (p.start_at && p.end_at) {
    if (formatTanggal(p.start_at) === formatTanggal(p.end_at)) return `${formatTanggal(p.start_at)} · ${formatJam(p.start_at)}–${formatJam(p.end_at)} WIB`;
    return `${formatTanggal(p.start_at, 'day-month')} – ${formatTanggal(p.end_at, 'day-month')}`;
  }
  return p.start_at ? `Mulai ${formatTanggalJam(p.start_at)}` : `Sampai ${formatTanggalJam(p.end_at)}`;
}

export function PackagesView() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [tab, setTab] = useState('');
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { loading, error, data, reload } = useResource(() => api.list('/admin/packages', { query: { per_page: 100 } }), []);

  useEffect(() => {
    if (params.get('baru') === '1') {
      setCreateOpen(true);
      router.replace(pathname, { scroll: false });
    }
  }, [params, pathname, router]);

  const all = useMemo(() => data || [], [data]);
  const counts = useMemo(() => ({ '': all.length, terbit: all.filter((p) => p.status === 'terbit').length, draft: all.filter((p) => p.status === 'draft').length, arsip: all.filter((p) => p.status === 'arsip').length }), [all]);
  const shown = all.filter((p) => (!tab || p.status === tab) && (!q || p.title.toLowerCase().includes(q.toLowerCase())));

  const setStatus = async (p, status) => {
    setBusyId(p.id);
    try {
      await api.patch(`/admin/packages/${p.id}/status`, { status });
      toast.success({ terbit: 'Paket diterbitkan', draft: 'Paket dijadikan draf', arsip: 'Paket diarsipkan' }[status], p.title);
      reload({ silent: true });
    } catch (err) {
      toast.error('Gagal mengubah status', err.fields?.status || errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const menuFor = (p) => [
    { label: 'Kelola paket', icon: <Settings2 />, href: `/admin/paket/${p.id}` },
    { label: 'Lihat laporan', icon: <BarChart3 />, href: `/admin/laporan?paket=${p.id}` },
    { divider: true },
    p.status !== 'terbit' && { label: 'Terbitkan', icon: <Send />, onClick: () => setStatus(p, 'terbit'), disabled: busyId === p.id || !p.question_count, description: !p.question_count ? 'Isi soal terlebih dahulu' : undefined },
    p.status === 'terbit' && { label: 'Jadikan draf', icon: <Undo2 />, onClick: () => setStatus(p, 'draft'), disabled: busyId === p.id },
    p.status !== 'arsip' && { label: 'Arsipkan', icon: <Archive />, onClick: () => setStatus(p, 'arsip'), disabled: busyId === p.id },
    { divider: true },
    { label: 'Hapus', icon: <Trash2 />, danger: true, onClick: () => setToDelete(p) },
  ].filter(Boolean);

  return (
    <div>
      <AdminPageHeader
        title="Paket ujian"
        description="Susun paket tryout dari bank soal, atur jadwal, durasi, dan passing grade."
        actions={
          <Button icon={<Plus />} onClick={() => setCreateOpen(true)}>
            Buat paket
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar min-w-0 overflow-x-auto">
          <Segmented
            value={tab}
            onChange={setTab}
            ariaLabel="Filter status paket"
            options={[
              { value: '', label: 'Semua', count: loading ? undefined : counts[''] },
              { value: 'terbit', label: 'Terbit', count: loading ? undefined : counts.terbit },
              { value: 'draft', label: 'Draf', count: loading ? undefined : counts.draft },
              { value: 'arsip', label: 'Arsip', count: loading ? undefined : counts.arsip },
            ]}
          />
        </div>
        <SearchInput value={q} onChange={setQ} placeholder="Cari judul paket…" size="sm" className="sm:w-72" />
      </div>

      {error ? (
        <Panel padding="none">
          <ErrorState error={error} onRetry={() => reload()} />
        </Panel>
      ) : loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[20px] bg-white p-2 ring-1 ring-inset ring-mist-100">
              <Skeleton className="h-24 w-full" rounded="rounded-[14px]" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-2/3" rounded="rounded-md" />
                <Skeleton className="h-2.5 w-full" rounded="rounded-full" />
                <Skeleton className="h-8 w-1/2" rounded="rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : !shown.length ? (
        <EmptyState
          variant="dashed"
          icon={all.length ? <FilterX /> : <FileStack />}
          title={all.length ? 'Tidak ada paket yang cocok' : 'Belum ada paket ujian'}
          description={all.length ? 'Ubah filter status atau kata kunci pencarian.' : 'Buat paket pertama lalu isi soal secara otomatis sesuai komposisi SKD.'}
          action={
            !all.length && (
              <Button icon={<Plus />} onClick={() => setCreateOpen(true)}>
                Buat paket
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {shown.map((p) => (
            <article key={p.id} className="flex flex-col rounded-[20px] bg-white p-2 ring-1 ring-inset ring-mist-100 transition-[box-shadow,color] duration-200 hover:ring-2 hover:ring-cobalt focus-within:ring-2 focus-within:ring-cobalt">
              <div className="rounded-[14px] bg-ghost px-4 pb-4 pt-3.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-mono text-[11px] font-medium tracking-wide text-mist-700">{shortCode(p.id)}</p>
                  <div className="-mr-2 -mt-1 flex items-center gap-1">
                    <StatusPill status={p.status} />
                    <Menu items={menuFor(p)} label={`Aksi untuk ${p.title}`} />
                  </div>
                </div>
                <h2 className="mt-1.5 line-clamp-1 text-[16px] font-semibold tracking-[-0.01em]">
                  <Link href={`/admin/paket/${p.id}`} className="rounded-md hover:text-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-1 line-clamp-1 text-sm text-mist-700">{p.description || 'Tanpa deskripsi'}</p>
              </div>

              <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div className="min-w-0">
                    <dt className="text-xs text-mist-700">Jadwal</dt>
                    <dd className="mt-0.5 truncate font-medium" title={scheduleText(p)}>
                      {scheduleText(p)}
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className="text-xs text-mist-700">Passing grade</dt>
                    <dd className="mt-0.5 font-mono text-[13px] font-medium tabular-nums">
                      {p.pass_twk}/{p.pass_tiu}/{p.pass_tkp}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-mist-700">Komposisi soal</span>
                    <span className="font-semibold tabular-nums">
                      {formatAngka(p.question_count)}
                      <span className="font-normal text-mist-500">/110</span>
                    </span>
                  </div>
                  <CompositionBar counts={p.counts} total={110} />
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <Chip size="sm" color="warning" icon={<Clock3 />} mono>
                    {p.duration_minutes} menit
                  </Chip>
                  <Chip size="sm" color="cobalt" icon={<Users />}>
                    {formatAngka(p.attempts_count)} peserta
                  </Chip>
                  {(p.shuffle_questions || p.shuffle_options) && (
                    <Chip size="sm" color="mist" icon={<Shuffle />}>
                      Acak
                    </Chip>
                  )}
                  {p.start_at && (
                    <Chip size="sm" color="mint" icon={<CalendarClock />} className="hidden sm:inline-flex">
                      Terjadwal
                    </Chip>
                  )}
                </div>
              </div>
              <div className="flex gap-2 border-t border-mist-100 px-2 pb-0.5 pt-2">
                <Button variant="ghost" size="sm" icon={<ListChecks />} href={`/admin/paket/${p.id}`} className="flex-1">
                  Kelola
                </Button>
                <Button variant="ghost" size="sm" icon={<BarChart3 />} href={`/admin/laporan?paket=${p.id}`} className="flex-1">
                  Laporan
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <PackageFormModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => reload({ silent: true })} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        tone="danger"
        title={`Hapus "${toDelete?.title}"?`}
        description={
          toDelete?.attempts_count
            ? `Paket ini sudah dikerjakan ${toDelete.attempts_count} peserta sehingga tidak dapat dihapus. Arsipkan paket agar riwayat hasil tetap tersimpan.`
            : 'Paket dan susunan soalnya akan dihapus permanen. Soal di bank soal tidak ikut terhapus.'
        }
        confirmText="Ya, hapus paket"
        onConfirm={async () => {
          const p = toDelete;
          try {
            await api.del(`/admin/packages/${p.id}`);
            toast.success('Paket dihapus', p.title);
            reload({ silent: true });
          } catch (err) {
            if (err.status === 409) {
              toast({
                tone: 'warning',
                title: 'Paket tidak dapat dihapus',
                description: `${errorMessage(err)} Arsipkan saja agar tidak tampil ke peserta.`,
                duration: 8000,
                action: p.status !== 'arsip' ? { label: 'Arsipkan', onClick: () => setStatus(p, 'arsip') } : undefined,
              });
              return undefined;
            }
            toast.error('Gagal menghapus paket', errorMessage(err));
            return false;
          }
        }}
      />
    </div>
  );
}

export default PackagesView;
