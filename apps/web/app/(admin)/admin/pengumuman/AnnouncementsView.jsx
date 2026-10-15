'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Eye, Heart, Megaphone, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatAngka, formatRelatif, formatTanggalJam } from '@/lib/format';
import { Avatar, Button, ConfirmDialog, EmptyState, ErrorState, Field, IconButton, Input, Modal, Skeleton, Switch, Textarea, useToast } from '@/components/ui';
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
  const [stats, setStats] = useState(null); // pengumuman yang dibuka detail interaksinya

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
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="mr-auto flex items-center gap-1.5 text-xs text-mist-700" title={formatTanggalJam(a.created_at)}>
                  <CalendarDays className="h-3.5 w-3.5" /> {formatRelatif(a.created_at)}
                </p>
                <button
                  type="button"
                  onClick={() => setStats(a)}
                  title="Lihat peserta yang melihat & menyukai"
                  aria-label={`Interaksi peserta: ${a.views || 0} dilihat, ${a.likes || 0} suka. Lihat detail.`}
                  className="inline-flex h-7 cursor-pointer items-center gap-2.5 rounded-full bg-ghost px-3 text-xs font-semibold tabular-nums text-obsidian-600 ring-1 ring-inset ring-mist-100 transition-colors hover:bg-cobalt-50 hover:text-cobalt-700 hover:ring-cobalt-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                >
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" aria-hidden /> {formatAngka(a.views || 0)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className={a.likes ? 'h-3.5 w-3.5 fill-danger text-danger' : 'h-3.5 w-3.5'} aria-hidden /> {formatAngka(a.likes || 0)}
                  </span>
                </button>
              </div>
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

      <EngagementModal item={stats} onClose={() => setStats(null)} />

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

/** Detail interaksi: siapa saja peserta yang melihat & menyukai pengumuman (GET /admin/announcements/:id/engagement). */
function EngagementModal({ item, onClose }) {
  const [tab, setTab] = useState('lihat');
  const id = item?.id;
  const { loading, error, data, reload } = useResource(() => (id ? api.get(`/admin/announcements/${id}/engagement`) : Promise.resolve(null)), [id]);
  const viewers = data?.viewers || [];
  const list = tab === 'suka' ? viewers.filter((x) => x.liked) : viewers;
  const audience = data?.audience || 0;
  const pct = audience ? Math.round(((data?.views || 0) / audience) * 100) : 0;

  return (
    <Modal open={!!item} onClose={onClose} size="md" icon={<Users />} eyebrow="Interaksi peserta" title={item?.title || ''}>
      {error ? (
        <ErrorState error={error} onRetry={() => reload()} />
      ) : (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-ghost p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-mist-700">
                <Eye className="h-3.5 w-3.5" aria-hidden /> Dilihat
              </p>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{formatAngka(data?.views || 0)}</p>
              )}
              <p className="mt-1.5 text-xs text-mist-700">
                dari {formatAngka(audience)} peserta · <span className="font-semibold text-obsidian">{pct}%</span>
              </p>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-mist-100">
                <span className="block h-full rounded-full bg-cobalt" style={{ width: `${Math.min(100, pct)}%` }} />
              </span>
            </div>
            <div className="rounded-2xl bg-danger-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-danger-700">
                <Heart className="h-3.5 w-3.5 fill-danger text-danger" aria-hidden /> Disukai
              </p>
              {loading ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <p className="mt-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{formatAngka(data?.likes || 0)}</p>
              )}
              <p className="mt-1.5 text-xs text-mist-700">
                {data?.views ? `${Math.round(((data?.likes || 0) / data.views) * 100)}% dari yang melihat` : 'peserta menyukai'}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Segmented
              value={tab}
              onChange={setTab}
              ariaLabel="Daftar peserta"
              options={[
                { value: 'lihat', label: 'Melihat', count: loading ? undefined : viewers.length },
                { value: 'suka', label: 'Menyukai', count: loading ? undefined : viewers.filter((x) => x.liked).length },
              ]}
            />
          </div>

          <ul className="mt-3 max-h-[320px] divide-y divide-mist-100 overflow-y-auto">
            {loading ? (
              [0, 1, 2].map((k) => (
                <li key={k} className="py-2.5">
                  <Skeleton className="h-9 w-full" />
                </li>
              ))
            ) : !list.length ? (
              <li className="py-8 text-center text-sm text-mist-700">{tab === 'suka' ? 'Belum ada peserta yang menyukai.' : 'Belum ada peserta yang melihat.'}</li>
            ) : (
              list.map((x) => (
                <li key={x.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={x.name} src={x.avatar_url || undefined} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-obsidian">{x.name}</p>
                    <p className="truncate text-xs text-mist-700">{x.email}</p>
                  </div>
                  {x.liked && <Heart className="h-4 w-4 shrink-0 fill-danger text-danger" aria-label="Menyukai" />}
                  <span className="shrink-0 text-right text-[11px] text-mist-500" title={formatTanggalJam(tab === 'suka' ? x.liked_at : x.viewed_at)}>
                    {formatRelatif(tab === 'suka' ? x.liked_at : x.viewed_at)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </Modal>
  );
}

export default AnnouncementsView;
