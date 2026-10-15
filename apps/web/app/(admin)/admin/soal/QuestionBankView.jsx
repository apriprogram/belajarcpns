'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Download, Eye, FileStack, FileUp, FilterX, LibraryBig, Pencil, Plus, Send, SlidersHorizontal, Tags, Trash2, Undo2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { excerpt, formatTanggal } from '@/lib/format';
import {
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Menu,
  Modal,
  Pagination,
  SearchInput,
  Select,
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
import { SubtestChip } from '@/components/admin/AdminParts';
import { AdminPageHeader, FilterBar, ModalTitle, Panel, PanelFooter, StatusPill, TableSkin } from '@/components/admin/AdminUI';
import { Segmented } from '@/components/admin/Segmented';
import { QuestionPreview } from '@/components/admin/QuestionPreview';
import { ImportCsvModal } from '@/components/admin/ImportCsvModal';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { DIFFICULTY_OPTIONS, SUBTESTS, shortCode, useResource } from '@/components/admin/shared';

const PER_PAGE = 10;
const EMPTY_FILTER = { q: '', subtest: '', category_id: '', difficulty: '', status: '', page: 1 };

function toPayload(q, status) {
  return {
    subtest: q.subtest,
    category_id: q.category_id ?? null,
    body: q.body,
    image_url: q.image_url || '',
    difficulty: q.difficulty,
    explanation: q.explanation || '',
    status,
    options: (q.options || []).map((o) => ({ label: o.label, body: o.body, weight: o.weight })),
  };
}

export function QuestionBankView() {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [f, setF] = useState(EMPTY_FILTER);
  const [search, setSearch] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (params.get('import') === '1') {
      setImportOpen(true);
      router.replace(pathname, { scroll: false });
    }
  }, [params, pathname, router]);

  const cats = useResource(() => api.get('/admin/categories'), []);
  const list = useResource(
    () =>
      api.list('/admin/questions', {
        query: { q: f.q, subtest: f.subtest, category_id: f.category_id, difficulty: f.difficulty, status: f.status, page: f.page, per_page: PER_PAGE, with_options: 1 },
      }),
    [f],
  );

  const categories = useMemo(() => cats.data || [], [cats.data]);
  const parents = useMemo(() => Object.fromEntries(categories.filter((c) => !c.parent_id).map((c) => [c.code, c.question_count])), [categories]);
  const totalAll = SUBTESTS.reduce((a, k) => a + (parents[k] || 0), 0);
  const subOptions = categories
    .filter((c) => c.parent_id && (!f.subtest || c.code === f.subtest))
    .map((c) => ({ value: String(c.id), label: f.subtest ? c.name : `${c.code} · ${c.name}` }));

  const update = (patch) => setF((s) => ({ ...s, page: 1, ...patch }));
  const hasFilter = !!(f.q || f.subtest || f.category_id || f.difficulty || f.status);
  const activeFilters = [f.category_id, f.difficulty, f.status].filter(Boolean).length;
  const reloadAll = useCallback(() => {
    list.reload({ silent: true });
    cats.reload({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.reload, cats.reload]);

  const toggleStatus = async (q) => {
    const next = q.status === 'terbit' ? 'draft' : 'terbit';
    setBusyId(q.id);
    try {
      await api.put(`/admin/questions/${q.id}`, toPayload(q, next));
      toast.success(next === 'terbit' ? 'Soal diterbitkan' : 'Soal dijadikan draf', excerpt(q.body, 60));
      list.setData((rows) => rows.map((r) => (r.id === q.id ? { ...r, status: next } : r)));
      if (preview?.id === q.id) setPreview((p) => ({ ...p, status: next }));
      cats.reload({ silent: true });
    } catch (err) {
      toast.error('Gagal mengubah status', errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const doExport = async () => {
    setExporting(true);
    try {
      await api.download('/admin/questions/export', undefined, { query: { subtest: f.subtest, status: f.status, difficulty: f.difficulty, category_id: f.category_id, q: f.q } });
      toast.success('Ekspor dimulai', 'File CSV bank soal sedang diunduh.');
    } catch (err) {
      toast.error('Gagal mengekspor', errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const menuFor = (q) => [
    { label: 'Pratinjau', icon: <Eye />, onClick: () => setPreview(q) },
    { label: 'Ubah', icon: <Pencil />, href: `/admin/soal/${q.id}` },
    q.status === 'terbit'
      ? { label: 'Jadikan draf', icon: <Undo2 />, onClick: () => toggleStatus(q), disabled: busyId === q.id }
      : { label: 'Terbitkan', icon: <Send />, onClick: () => toggleStatus(q), disabled: busyId === q.id },
    { divider: true },
    { label: 'Hapus', icon: <Trash2 />, danger: true, onClick: () => setToDelete(q) },
  ];

  const rows = list.data || [];

  return (
    <div>
      <AdminPageHeader
        title="Bank soal"
        description="Kelola soal TWK, TIU, dan TKP beserta kunci, bobot, dan pembahasannya."
        actions={
          <>
            <Button variant="secondary" icon={<Tags />} onClick={() => setCatOpen(true)}>
              Kategori
            </Button>
            <Button variant="secondary" icon={<Download />} onClick={doExport} loading={exporting}>
              Ekspor CSV
            </Button>
            <Button variant="secondary" icon={<FileUp />} onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
            <Button icon={<Plus />} href="/admin/soal/baru">
              Tambah soal
            </Button>
          </>
        }
      />

      <Panel padding="none" className="overflow-hidden">
        <FilterBar
          left={
            <Segmented
              value={f.subtest}
              onChange={(v) => update({ subtest: v, category_id: '' })}
              ariaLabel="Filter subtes"
              options={[{ value: '', label: 'Semua', count: cats.loading ? undefined : totalAll }, ...SUBTESTS.map((s) => ({ value: s, label: s, count: cats.loading ? undefined : parents[s] || 0 }))]}
            />
          }
          right={
            <>
              <SearchInput value={search} onChange={setSearch} onSearch={(q) => update({ q: q.trim() })} placeholder="Cari teks soal…" size="sm" shortcut className="sm:w-72" />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<SlidersHorizontal />}
                  onClick={() => setShowFilters((x) => !x)}
                  aria-expanded={showFilters}
                  aria-controls="soal-filter"
                  className="flex-1 sm:flex-none"
                >
                  Filter
                  {activeFilters > 0 && <span className="ml-1.5 rounded-md bg-cobalt px-1.5 text-[11px] font-semibold text-white">{activeFilters}</span>}
                </Button>
                {hasFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<FilterX />}
                    onClick={() => {
                      setSearch('');
                      setF(EMPTY_FILTER);
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </>
          }
        >
          {showFilters && (
            <div id="soal-filter" className="mt-3 grid grid-cols-2 gap-2 border-t border-mist-100 pt-3 sm:grid-cols-3 lg:flex lg:justify-end">
              <Select
                size="sm"
                aria-label="Sub-kategori"
                value={f.category_id}
                onChange={(e) => update({ category_id: e.target.value })}
                placeholder="Semua sub-kategori"
                options={subOptions}
                wrapperClassName="col-span-2 sm:col-span-1 lg:w-60"
              />
              <Select size="sm" aria-label="Kesulitan" value={f.difficulty} onChange={(e) => update({ difficulty: e.target.value })} placeholder="Semua kesulitan" options={DIFFICULTY_OPTIONS} wrapperClassName="lg:w-44" />
              <Select
                size="sm"
                aria-label="Status"
                value={f.status}
                onChange={(e) => update({ status: e.target.value })}
                placeholder="Semua status"
                options={[
                  { value: 'terbit', label: 'Terbit' },
                  { value: 'draft', label: 'Draf' },
                ]}
                wrapperClassName="lg:w-40"
              />
            </div>
          )}
        </FilterBar>

        {list.error ? (
          <ErrorState error={list.error} onRetry={() => list.reload()} />
        ) : (
          <>
            {/* Desktop: tabel */}
            <TableSkin className="hidden md:block">
              <TableContainer className="!rounded-none">
                <Table aria-busy={list.loading || undefined}>
                  <THead>
                    <Tr>
                      <Th>Soal</Th>
                      <Th>Subtes</Th>
                      <Th>Kategori</Th>
                      <Th>Kesulitan</Th>
                      <Th>Status</Th>
                      <Th align="center">Dipakai</Th>
                      <Th align="right">
                        <span className="sr-only">Aksi</span>
                      </Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {list.loading && !rows.length ? (
                      <TableSkeleton rows={8} cols={7} />
                    ) : !rows.length ? (
                      <TableEmpty colSpan={7}>
                        <EmptyBank hasFilter={hasFilter} />
                      </TableEmpty>
                    ) : (
                      rows.map((q) => (
                        <Tr key={q.id} onClick={() => setPreview(q)} className={list.loading ? 'opacity-60' : undefined}>
                          <Td className="max-w-[420px]">
                            <p className="line-clamp-2 font-medium leading-snug">{q.body}</p>
                            <p className="mt-1 font-mono text-[11px] text-mist-500">
                              {shortCode(q.id, 'SOAL')} · {formatTanggal(q.updated_at)}
                            </p>
                          </Td>
                          <Td>
                            <SubtestChip code={q.subtest} />
                          </Td>
                          <Td muted className="max-w-[180px] truncate">
                            {q.category_name || '—'}
                          </Td>
                          <Td>
                            <StatusPill status={q.difficulty} dot={false} />
                          </Td>
                          <Td>
                            <StatusPill status={q.status} />
                          </Td>
                          <Td align="center">
                            <span className={q.used_in_packages ? 'font-semibold tabular-nums' : 'tabular-nums text-mist-500'} title={`Dipakai di ${q.used_in_packages} paket`}>
                              {q.used_in_packages} <span className="font-normal text-mist-700">paket</span>
                            </span>
                          </Td>
                          <Td align="right" onClick={(e) => e.stopPropagation()}>
                            <Menu items={menuFor(q)} label={`Aksi untuk soal ${shortCode(q.id, 'SOAL')}`} />
                          </Td>
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            </TableSkin>

            {/* Mobile: daftar kartu */}
            <ul className="divide-y divide-mist-100 md:hidden">
              {list.loading && !rows.length ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="space-y-2 p-4">
                    <Skeleton className="h-4 w-11/12" rounded="rounded-md" />
                    <Skeleton className="h-4 w-2/3" rounded="rounded-md" />
                    <Skeleton className="h-6 w-1/2" rounded="rounded-full" />
                  </li>
                ))
              ) : !rows.length ? (
                <li>
                  <EmptyBank hasFilter={hasFilter} />
                </li>
              ) : (
                rows.map((q) => (
                  <li key={q.id} className="flex gap-3 p-4">
                    <button type="button" onClick={() => setPreview(q)} className="min-w-0 flex-1 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">{q.body}</p>
                      <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <SubtestChip code={q.subtest} />
                        <StatusPill status={q.difficulty} dot={false} />
                        <StatusPill status={q.status} />
                        {q.used_in_packages > 0 && (
                          <Chip size="sm" color="mist" icon={<FileStack />}>
                            {q.used_in_packages}
                          </Chip>
                        )}
                      </span>
                    </button>
                    <Menu items={menuFor(q)} label="Aksi soal" />
                  </li>
                ))
              )}
            </ul>

            {list.meta && rows.length > 0 && (
              <PanelFooter>
                <Pagination meta={list.meta} onChange={(p) => setF((s) => ({ ...s, page: p }))} />
              </PanelFooter>
            )}
          </>
        )}
      </Panel>

      {/* Pratinjau */}
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title={
          <ModalTitle icon={<Eye />}>
            Pratinjau soal {preview && <span className="ml-1 font-mono text-[13px] font-medium text-mist-700">{shortCode(preview.id, 'SOAL')}</span>}
          </ModalTitle>
        }
        size="lg"
        footer={
          preview && (
            <>
              <Button variant="secondary" onClick={() => setPreview(null)}>
                Tutup
              </Button>
              <Button variant="secondary" icon={preview.status === 'terbit' ? <Undo2 /> : <Send />} loading={busyId === preview.id} onClick={() => toggleStatus(preview)}>
                {preview.status === 'terbit' ? 'Jadikan draf' : 'Terbitkan'}
              </Button>
              <Button icon={<Pencil />} href={`/admin/soal/${preview.id}`}>
                Ubah soal
              </Button>
            </>
          )
        }
      >
        {preview && (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-mist-700">
              <StatusPill status={preview.status} />
              <span>Dipakai di {preview.used_in_packages} paket</span>
              <span aria-hidden>·</span>
              <span>Diperbarui {formatTanggal(preview.updated_at)}</span>
            </div>
            <QuestionPreview question={preview} />
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        tone="danger"
        title="Hapus soal ini?"
        description={
          toDelete?.used_in_packages
            ? `Soal ini dipakai di ${toDelete.used_in_packages} paket dan akan dikeluarkan dari paket tersebut. Soal yang sudah pernah dikerjakan peserta tidak dapat dihapus.`
            : 'Soal akan dihapus permanen dari bank soal. Soal yang sudah pernah dikerjakan peserta tidak dapat dihapus.'
        }
        confirmText="Ya, hapus soal"
        onConfirm={async () => {
          try {
            await api.del(`/admin/questions/${toDelete.id}`);
            toast.success('Soal dihapus');
            if (preview?.id === toDelete.id) setPreview(null);
            if (rows.length === 1 && f.page > 1) setF((s) => ({ ...s, page: s.page - 1 }));
            else reloadAll();
          } catch (err) {
            toast.error(err.status === 409 ? 'Soal tidak dapat dihapus' : 'Gagal menghapus soal', errorMessage(err));
            if (err.status === 409) return undefined; // tutup dialog: saran sudah disampaikan lewat toast
            return false;
          }
        }}
      >
        {toDelete && <p className="rounded-xl bg-ghost p-3 text-left text-sm text-obsidian-600">{excerpt(toDelete.body, 140)}</p>}
      </ConfirmDialog>

      <ImportCsvModal open={importOpen} onClose={() => setImportOpen(false)} onImported={reloadAll} />
      <CategoryManager open={catOpen} onClose={() => setCatOpen(false)} categories={categories} loading={cats.loading} initialSubtest={f.subtest || 'TWK'} onChanged={() => cats.reload({ silent: true })} />
    </div>
  );
}

function EmptyBank({ hasFilter }) {
  return hasFilter ? (
    <EmptyState size="sm" icon={<FilterX />} title="Tidak ada soal yang cocok" description="Ubah kata kunci atau filter untuk melihat soal lain." />
  ) : (
    <EmptyState
      size="sm"
      icon={<LibraryBig />}
      title="Bank soal masih kosong"
      description="Tambahkan soal satu per satu atau import dari CSV."
      action={
        <Button size="sm" icon={<Plus />} href="/admin/soal/baru">
          Tambah soal
        </Button>
      }
    />
  );
}

export default QuestionBankView;
