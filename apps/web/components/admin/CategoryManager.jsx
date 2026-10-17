'use client';

import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatAngka } from '@/lib/format';
import { Button, ConfirmDialog, EmptyState, IconButton, Input, Modal, Skeleton, useToast } from '@/components/ui';
import { ModalTitle } from './AdminUI';
import { Segmented } from './Segmented';
import { SUBTESTS, SUBTEST_NAME } from './shared';

/** Modal kelola sub-kategori per subtes (tambah, ubah nama, hapus). */
export function CategoryManager({ open, onClose, categories = [], loading, onChanged, initialSubtest = 'TWK' }) {
  const toast = useToast();
  const [tab, setTab] = useState(initialSubtest);
  const [newName, setNewName] = useState('');
  const [newErr, setNewErr] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editErr, setEditErr] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    if (open) setTab(SUBTESTS.includes(initialSubtest) ? initialSubtest : 'TWK');
  }, [open, initialSubtest]);

  const subs = categories.filter((c) => c.parent_id && c.code === tab);
  const counts = Object.fromEntries(SUBTESTS.map((s) => [s, categories.filter((c) => c.parent_id && c.code === s).length]));

  const add = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) {
      setNewErr('Nama sub-kategori wajib diisi.');
      return;
    }
    setAdding(true);
    try {
      await api.post('/admin/categories', { code: tab, name });
      toast.success('Sub-kategori ditambahkan', `${name} (${tab})`);
      setNewName('');
      setNewErr(null);
      onChanged && (await onChanged());
    } catch (err) {
      setNewErr(err instanceof ApiError && err.fields ? err.fields.name || err.message : errorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (c) => {
    const name = editName.trim();
    if (!name) {
      setEditErr('Nama wajib diisi.');
      return;
    }
    setSavingEdit(true);
    try {
      await api.put(`/admin/categories/${c.id}`, { name });
      toast.success('Sub-kategori diperbarui');
      setEditId(null);
      onChanged && (await onChanged());
    } catch (err) {
      setEditErr(err instanceof ApiError && err.fields ? err.fields.name || err.message : errorMessage(err));
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={<ModalTitle icon={<Tags />}>Kelola sub-kategori</ModalTitle>}
        description="Sub-kategori membantu mengelompokkan soal per materi dan dipakai pada filter latihan."
        size="md"
        footer={<Button onClick={onClose}>Selesai</Button>}
      >
        <Segmented
          fullWidth
          value={tab}
          onChange={(t) => {
            setTab(t);
            setEditId(null);
            setNewErr(null);
          }}
          options={SUBTESTS.map((s) => ({ value: s, label: s, count: counts[s] }))}
          ariaLabel="Subtes"
        />
        <p className="mt-3 text-sm text-mist-700">{SUBTEST_NAME[tab]}</p>

        <form onSubmit={add} className="mt-4 flex items-start gap-2" noValidate>
          <div className="min-w-0 flex-1">
            <label htmlFor="cat-new" className="sr-only">
              Nama sub-kategori baru
            </label>
            <Input
              id="cat-new"
              size="sm"
              value={newName}
              state={newErr ? 'error' : undefined}
              aria-describedby={newErr ? 'cat-new-err' : undefined}
              onChange={(e) => {
                setNewName(e.target.value);
                setNewErr(null);
              }}
              placeholder={`Sub-kategori ${tab} baru, mis. Bela Negara`}
              maxLength={80}
            />
            {newErr && (
              <p id="cat-new-err" role="alert" className="mt-1.5 text-[13px] text-danger-700">
                {newErr}
              </p>
            )}
          </div>
          <Button type="submit" size="sm" icon={<Plus />} loading={adding} className="!h-9">
            Tambah
          </Button>
        </form>

        <ul className="mt-5 divide-y divide-mist-100 overflow-hidden rounded-2xl ring-1 ring-inset ring-mist-100">
          {loading && !categories.length ? (
            Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="px-4 py-3.5">
                <Skeleton className="h-4 w-1/2" rounded="rounded-md" />
              </li>
            ))
          ) : !subs.length ? (
            <li>
              <EmptyState size="sm" icon={<Tags />} title={`Belum ada sub-kategori ${tab}`} description="Tambahkan sub-kategori pertama di atas." />
            </li>
          ) : (
            subs.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                {editId === c.id ? (
                  <form
                    className="flex min-w-0 flex-1 items-start gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEdit(c);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <label htmlFor={`cat-edit-${c.id}`} className="sr-only">
                        Nama sub-kategori
                      </label>
                      <Input
                        id={`cat-edit-${c.id}`}
                        size="sm"
                        autoFocus
                        value={editName}
                        state={editErr ? 'error' : undefined}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          setEditErr(null);
                        }}
                        onKeyDown={(e) => e.key === 'Escape' && (e.stopPropagation(), setEditId(null))}
                        maxLength={80}
                      />
                      {editErr && <p className="mt-1 text-[13px] text-danger-700">{editErr}</p>}
                    </div>
                    <IconButton type="submit" icon={<Check />} label="Simpan nama" variant="dark" size="md" loading={savingEdit} />
                    <IconButton icon={<X />} label="Batal ubah" variant="soft" size="md" onClick={() => setEditId(null)} />
                  </form>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-mist-700">{formatAngka(c.question_count)} soal</p>
                    </div>
                    <IconButton
                      icon={<Pencil />}
                      label={`Ubah ${c.name}`}
                      variant="ghost"
                      size="sm"
                     
                      onClick={() => {
                        setEditId(c.id);
                        setEditName(c.name);
                        setEditErr(null);
                      }}
                    />
                    <IconButton icon={<Trash2 />} label={`Hapus ${c.name}`} variant="ghost" size="sm" className="hover:!bg-danger-50 hover:!text-danger" onClick={() => setToDelete(c)} />
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        tone="danger"
        title={`Hapus "${toDelete?.name}"?`}
        description={
          toDelete?.question_count
            ? `${formatAngka(toDelete.question_count)} soal di sub-kategori ini akan menjadi tanpa sub-kategori. Soalnya sendiri tidak terhapus.`
            : 'Sub-kategori ini belum memiliki soal.'
        }
        onConfirm={async () => {
          try {
            await api.del(`/admin/categories/${toDelete.id}`);
            toast.success('Sub-kategori dihapus');
            onChanged && (await onChanged());
          } catch (err) {
            toast.error('Gagal menghapus', errorMessage(err));
            return false;
          }
        }}
      />
    </>
  );
}

export default CategoryManager;
