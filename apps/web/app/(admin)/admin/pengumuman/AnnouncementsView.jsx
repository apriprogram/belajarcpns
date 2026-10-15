'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatAngka, formatRelatif, formatTanggalJam } from '@/lib/format';
import { Button, ConfirmDialog, EmptyState, ErrorState, Field, IconButton, Input, Modal, Skeleton, Switch, Textarea, useToast } from '@/components/ui';
import { AdminPageHeader, IconBox, ModalTitle, Panel, StatusPill } from '@/components/admin/AdminUI';
import { Segmented } from '@/components/admin/Segmented';
import { FormAlert } from '@/components/auth/AuthParts';
import { useResource } from '@/components/admin/shared';

const BODY_MAX = 1000;

export function AnnouncementsView() {
  const toast = useToast();
  const { loading, error, data, reload, setData } = useResource(() => api.get('/admin/announcements'), []);
  const [tab, setTab] = useState('semua');
  const [editing, setEditing] = useState(null); // {} baru | objek
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const all = useMemo(() => data || [], [data]);
  const shown = all.filter((a) => tab === 'semua' || (tab === 'terbit' ? a.published : !a.published));

  const togglePublish = async (a, published) => {
    setBusyId(a.id);
    setData((rows) => rows.map((r) => (r.id === a.id ? { ...r, published } : r)));
    try {
      await api.put(`/admin/announcements/${a.id}`, { title: a.title, body: a.body, published });
      toast.success(published ? 'Pengumuman diterbitkan' : 'Pengumuman disembunyikan', a.title);
    } catch (err) {
      setData((rows) => rows.map((r) => (r.id === a.id ? { ...r, published: !published } : r)));
      toast.error('Gagal mengubah status', errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Pengumuman"
        description="Informasi yang tampil di dashboard peserta, mis. jadwal tryout atau pembaruan materi."
        actions={
          <Button icon={<Plus />} onClick={() => setEditing({})}>
            Buat pengumuman
          </Button>
        }
      />

      <div className="no-scrollbar mb-4 overflow-x-auto">
        <Segmented
          value={tab}
          onChange={setTab}
          ariaLabel="Filter pengumuman"
          options={[
            { value: 'semua', label: 'Semua', count: loading ? undefined : all.length },
            { value: 'terbit', label: 'Terbit', count: loading ? undefined : all.filter((a) => a.published).length },
            { value: 'draft', label: 'Draf', count: loading ? undefined : all.filter((a) => !a.published).length },
          ]}
        />
      </div>

      {error ? (
        <Panel padding="none">
          <ErrorState error={error} onRetry={() => reload()} />
        </Panel>
      ) : loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56" rounded="rounded-[20px]" />
          ))}
        </div>
      ) : !shown.length ? (
        <EmptyState
          variant="dashed"
          icon={<Megaphone />}
          title={all.length ? 'Tidak ada pengumuman di filter ini' : 'Belum ada pengumuman'}
          description={all.length ? 'Pilih filter lain untuk melihat pengumuman.' : 'Buat pengumuman pertama untuk menyapa peserta.'}
          action={
            !all.length && (
              <Button icon={<Plus />} onClick={() => setEditing({})}>
                Buat pengumuman
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((a) => (
            <Panel as="article" key={a.id} className="flex min-h-[240px] flex-col">
              <div className="flex items-start justify-between gap-3">
                <IconBox icon={<Megaphone />} tone={a.published ? 'cobalt' : 'default'} />
                <StatusPill status={a.published ? 'terbit' : 'draft'} />
              </div>
              <h2 className="mt-4 line-clamp-2 text-[16px] font-semibold leading-snug tracking-[-0.01em]">{a.title}</h2>
              <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-mist-700">{a.body}</p>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-mist-700" title={formatTanggalJam(a.created_at)}>
                <CalendarDays className="h-3.5 w-3.5" /> {formatRelatif(a.created_at)}
              </p>
              <div className="mt-auto flex items-center gap-2 border-t border-mist-100 pt-4">
                <Switch size="sm" checked={a.published} disabled={busyId === a.id} onChange={(v) => togglePublish(a, v)} label={<span className="text-[13px]">{a.published ? 'Terbit' : 'Draf'}</span>} className="mr-auto items-center" aria-label={`Terbitkan ${a.title}`} />
                <IconButton icon={<Pencil />} label={`Ubah ${a.title}`} variant="soft" size="sm" onClick={() => setEditing(a)} />
                <IconButton icon={<Trash2 />} label={`Hapus ${a.title}`} variant="danger" size="sm" onClick={() => setToDelete(a)} />
              </div>
            </Panel>
          ))}
        </div>
      )}

      <AnnouncementModal
        item={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          reload({ silent: true });
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        tone="danger"
        title="Hapus pengumuman?"
        description={toDelete ? `"${toDelete.title}" akan dihapus permanen dan tidak lagi tampil di dashboard peserta.` : ''}
        onConfirm={async () => {
          try {
            await api.del(`/admin/announcements/${toDelete.id}`);
            toast.success('Pengumuman dihapus');
            setData((rows) => rows.filter((r) => r.id !== toDelete.id));
          } catch (err) {
            toast.error('Gagal menghapus', errorMessage(err));
            return false;
          }
        }}
      />
    </div>
  );
}

function AnnouncementModal({ item, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = !!item?.id;
  const [v, setV] = useState({ title: '', body: '', published: true });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastItem, setLastItem] = useState(null);

  // Sinkronkan isian saat modal dibuka untuk item lain.
  if (item !== lastItem) {
    setLastItem(item);
    if (item) {
      setV({ title: item.title || '', body: item.body || '', published: item.id ? !!item.published : true });
      setErrors({});
      setFormError(null);
    }
  }

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (v.title.trim().length < 3) err.title = 'Judul minimal 3 karakter.';
    if (!v.body.trim()) err.body = 'Isi pengumuman wajib diisi.';
    if (v.body.length > BODY_MAX) err.body = `Maksimal ${BODY_MAX} karakter.`;
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = { title: v.title.trim(), body: v.body.trim(), published: v.published };
      if (isEdit) await api.put(`/admin/announcements/${item.id}`, payload);
      else await api.post('/admin/announcements', payload);
      toast.success(isEdit ? 'Pengumuman diperbarui' : 'Pengumuman dibuat', payload.title);
      onSaved();
    } catch (e2) {
      if (e2 instanceof ApiError && e2.fields) setErrors(e2.fields);
      setFormError(errorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!item}
      onClose={saving ? () => {} : onClose}
      title={<ModalTitle icon={<Megaphone />}>{isEdit ? 'Ubah pengumuman' : 'Buat pengumuman'}</ModalTitle>}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="ann-form" loading={saving}>
            {isEdit ? 'Simpan perubahan' : v.published ? 'Terbitkan' : 'Simpan draf'}
          </Button>
        </>
      }
    >
      <form id="ann-form" onSubmit={submit} noValidate className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field label="Judul" required error={errors.title}>
          <Input
            value={v.title}
            onChange={(e) => {
              setV((s) => ({ ...s, title: e.target.value }));
              setErrors((x) => ({ ...x, title: undefined }));
            }}
            maxLength={150}
            placeholder="mis. Tryout Akbar dibuka besok"
            data-autofocus
          />
        </Field>
        <Field
          label="Isi"
          required
          error={errors.body}
          labelAction={
            <span className={v.body.length > BODY_MAX ? 'font-mono text-xs text-danger-700' : 'font-mono text-xs text-mist-500'}>
              {formatAngka(v.body.length)}/{formatAngka(BODY_MAX)}
            </span>
          }
        >
          <Textarea
            rows={6}
            value={v.body}
            onChange={(e) => {
              setV((s) => ({ ...s, body: e.target.value }));
              setErrors((x) => ({ ...x, body: undefined }));
            }}
            placeholder="Tulis informasi untuk peserta…"
          />
        </Field>
        <div className="rounded-xl bg-ghost p-4">
          <Switch checked={v.published} onChange={(on) => setV((s) => ({ ...s, published: on }))} label="Terbitkan sekarang" description="Pengumuman terbit tampil di dashboard semua peserta." />
        </div>
      </form>
    </Modal>
  );
}

export default AnnouncementsView;
