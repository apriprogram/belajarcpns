'use client';

import { useMemo, useState } from 'react';
import { FilterX, ListPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAngka } from '@/lib/format';
import { Button, Checkbox, EmptyState, ErrorState, Modal, Pagination, SearchInput, Select, Skeleton } from '@/components/ui';
import { SubtestChip } from './AdminParts';
import { ModalTitle, StatusPill } from './AdminUI';
import { Segmented } from './Segmented';
import { DIFFICULTY_OPTIONS, SUBTESTS, useResource } from './shared';

const PER_PAGE = 20;

/**
 * Modal pilih soal dari bank soal (multi-pilih dengan checkbox).
 * existingIds: Set id yang sudah di paket (dinonaktifkan) · onAdd(questions[])
 */
export function QuestionPickerModal({ open, onClose, existingIds, onAdd, adding }) {
  const [f, setF] = useState({ q: '', subtest: '', category_id: '', difficulty: '', status: 'terbit', page: 1 });
  const [selected, setSelected] = useState({});
  const cats = useResource(() => (open ? api.get('/admin/categories') : Promise.resolve([])), [open]);
  const list = useResource(
    () => (open ? api.list('/admin/questions', { query: { ...f, per_page: PER_PAGE } }) : Promise.resolve({ data: [], meta: null })),
    [open, f],
  );
  const update = (patch) => setF((s) => ({ ...s, page: 1, ...patch }));
  const rows = list.data || [];
  const selectable = rows.filter((r) => !existingIds.has(r.id));
  const allOnPage = selectable.length > 0 && selectable.every((r) => selected[r.id]);
  const someOnPage = selectable.some((r) => selected[r.id]);
  const selCount = Object.keys(selected).length;
  const selBySub = useMemo(() => {
    const m = { TWK: 0, TIU: 0, TKP: 0 };
    Object.values(selected).forEach((q) => (m[q.subtest] = (m[q.subtest] || 0) + 1));
    return m;
  }, [selected]);
  const subOptions = (cats.data || []).filter((c) => c.parent_id && (!f.subtest || c.code === f.subtest)).map((c) => ({ value: String(c.id), label: f.subtest ? c.name : `${c.code} · ${c.name}` }));

  const toggle = (q) =>
    setSelected((s) => {
      const n = { ...s };
      if (n[q.id]) delete n[q.id];
      else n[q.id] = q;
      return n;
    });
  const togglePage = () =>
    setSelected((s) => {
      const n = { ...s };
      if (allOnPage) selectable.forEach((r) => delete n[r.id]);
      else selectable.forEach((r) => (n[r.id] = r));
      return n;
    });

  const close = () => {
    setSelected({});
    onClose && onClose();
  };

  return (
    <Modal
      open={open}
      onClose={adding ? () => {} : close}
      title={<ModalTitle icon={<ListPlus />}>Tambah soal ke paket</ModalTitle>}
      description="Soal terpilih ditambahkan ke akhir urutan paket."
      size="xl"
      bodyClassName="!pt-4"
      footer={
        <>
          <p className="mr-auto hidden text-sm text-mist-700 sm:block">
            {selCount ? (
              <>
                <span className="font-semibold text-obsidian">{selCount} soal</span> dipilih · TWK {selBySub.TWK} · TIU {selBySub.TIU} · TKP {selBySub.TKP}
              </>
            ) : (
              'Belum ada soal dipilih'
            )}
          </p>
          {selCount > 0 && (
            <Button variant="ghost" onClick={() => setSelected({})} disabled={adding}>
              Kosongkan
            </Button>
          )}
          <Button variant="secondary" onClick={close} disabled={adding}>
            Batal
          </Button>
          <Button
            disabled={!selCount}
            loading={adding}
            onClick={async () => {
              const ok = await onAdd(Object.values(selected));
              if (ok !== false) setSelected({});
            }}
          >
            Tambahkan {selCount ? `${selCount} soal` : ''}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Segmented
            size="sm"
            value={f.subtest}
            onChange={(v) => update({ subtest: v, category_id: '' })}
            ariaLabel="Subtes"
            options={[{ value: '', label: 'Semua' }, ...SUBTESTS.map((s) => ({ value: s, label: s }))]}
          />
          <SearchInput placeholder="Cari teks soal…" size="sm" onSearch={(q) => update({ q: q.trim() })} className="lg:flex-1" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Select size="sm" aria-label="Sub-kategori" value={f.category_id} onChange={(e) => update({ category_id: e.target.value })} placeholder="Semua sub-kategori" options={subOptions} wrapperClassName="col-span-2 sm:col-span-1" />
          <Select size="sm" aria-label="Kesulitan" value={f.difficulty} onChange={(e) => update({ difficulty: e.target.value })} placeholder="Semua kesulitan" options={DIFFICULTY_OPTIONS} />
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
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-inset ring-mist-100">
        <div className="flex items-center gap-3 border-b border-mist-100 bg-ghost px-4 py-2.5">
          <Checkbox checked={allOnPage} indeterminate={!allOnPage && someOnPage} onChange={togglePage} disabled={!selectable.length} label={<span className="text-xs font-semibold text-obsidian-600">Pilih semua di halaman ini</span>} />
          {list.meta && <span className="ml-auto text-xs text-mist-700">{formatAngka(list.meta.total)} soal</span>}
        </div>
        {list.error ? (
          <ErrorState size="sm" error={list.error} onRetry={() => list.reload()} />
        ) : list.loading && !rows.length ? (
          <div className="divide-y divide-mist-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="h-5 w-5" rounded="rounded-md" />
                <Skeleton className="h-4 flex-1" rounded="rounded-md" />
              </div>
            ))}
          </div>
        ) : !rows.length ? (
          <EmptyState size="sm" icon={<FilterX />} title="Tidak ada soal" description="Ubah filter atau kata kunci pencarian." />
        ) : (
          <ul className={cn('divide-y divide-mist-100', list.loading && 'opacity-60')}>
            {rows.map((q) => {
              const inPkg = existingIds.has(q.id);
              const checked = inPkg || !!selected[q.id];
              return (
                <li key={q.id} className={cn('px-4 py-3 transition-colors', checked && !inPkg && 'bg-cobalt-50/50', inPkg && 'opacity-60')}>
                  <Checkbox
                    checked={checked}
                    disabled={inPkg}
                    onChange={() => toggle(q)}
                    className="w-full"
                    label={<span className="line-clamp-2 font-normal leading-snug">{q.body}</span>}
                    description={
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <SubtestChip code={q.subtest} />
                        {q.category_name && <span className="text-xs text-mist-700">{q.category_name}</span>}
                        <StatusPill status={q.difficulty} dot={false} />
                        {q.status !== 'terbit' && <StatusPill status={q.status} dot={false} />}
                        {inPkg && <span className="text-xs font-semibold text-mint-700">Sudah di paket</span>}
                      </span>
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {list.meta && list.meta.total_pages > 1 && <Pagination meta={list.meta} onChange={(p) => setF((s) => ({ ...s, page: p }))} className="mt-4" />}
    </Modal>
  );
}

export default QuestionPickerModal;
