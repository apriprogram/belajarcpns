'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Eye, EyeOff, MessageSquareQuote, PencilLine, RefreshCw, Trash2 } from 'lucide-react';
import { useSiteActions } from '@/components/providers/SiteProvider';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatRelatif, formatTanggal, formatTanggalJam } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, ErrorState, Field, IconButton, Modal, SearchInput, Skeleton, Switch, Textarea, useToast } from '@/components/ui';
import { AdminPageHeader, FilterBar, ModalTitle, Panel, StatusPill } from '@/components/admin/AdminUI';
import { Segmented } from '@/components/admin/Segmented';
import { useResource } from '@/components/admin/shared';
import { CharCounter, normalizeTestimoni, StarInput, StarRating, TESTIMONI_MAX, TESTIMONI_MIN, TESTIMONI_STATUS, testimoniLength } from '@/components/testimoni/Stars';

const EMPTY_COUNTS = { semua: 0, pending: 0, published: 0, hidden: 0 };

/** Panel admin: moderasi testimoni peserta (tampilkan/sembunyikan, edit, hapus). Lihat docs/TESTIMONI.md. */
export function TestimoniView() {
  const toast = useToast();
  const [status, setStatus] = useState('semua');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { loading, error, data, reload, setData } = useResource(() => api.get('/admin/testimonials', { query: { status, q } }), [status, q]);
  const items = useMemo(() => data?.items || [], [data]);
  const counts = data?.counts || EMPTY_COUNTS;

  // Buka halaman → tandai semua testimoni sudah dilihat (setelah daftar pertama dimuat, agar penanda "Baru" tetap terlihat).
  const markedRef = useRef(false);
  useEffect(() => {
    if (!data || markedRef.current) return;
    markedRef.current = true;
    api
      .post('/admin/testimonials/read-all')
      .then(() => window.dispatchEvent(new CustomEvent('bisapns:testimonials-unread', { detail: 0 })))
      .catch(() => {});
  }, [data]);

  /** Ganti satu item + sesuaikan jumlah per status secara lokal. */
  const replaceLocal = (next, prevStatus) =>
    setData((d) => {
      if (!d) return d;
      const c = { ...(d.counts || EMPTY_COUNTS) };
      if (prevStatus && prevStatus !== next.status) {
        c[prevStatus] = Math.max(0, (c[prevStatus] || 0) - 1);
        c[next.status] = (c[next.status] || 0) + 1;
      }
      return { ...d, counts: c, items: d.items.map((t) => (t.id === next.id ? { ...t, ...next } : t)) };
    });

  const toggleShown = async (t, show) => {
    const nextStatus = show ? 'published' : 'hidden';
    setBusyId(t.id);
    replaceLocal({ ...t, status: nextStatus }, t.status); // optimistis
    try {
      const r = await api.patch(`/admin/testimonials/${t.id}`, { status: nextStatus });
      replaceLocal(r.testimonial, nextStatus);
      toast.success(show ? 'Testimoni ditampilkan' : 'Testimoni disembunyikan', show ? 'Kini tampil di halaman utama.' : 'Tidak lagi tampil di halaman utama.');
    } catch (err) {
      replaceLocal(t, nextStatus);
      toast.error('Gagal mengubah status', errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    const t = toDelete;
    try {
      await api.del(`/admin/testimonials/${t.id}`);
      setData((d) => {
        if (!d) return d;
        const c = { ...(d.counts || EMPTY_COUNTS) };
        c.semua = Math.max(0, c.semua - 1);
        c[t.status] = Math.max(0, (c[t.status] || 0) - 1);
        return { ...d, counts: c, items: d.items.filter((x) => x.id !== t.id) };
      });
      toast.success('Testimoni dihapus');
      return true;
    } catch (err) {
      toast.error('Gagal menghapus testimoni', errorMessage(err));
      return false;
    }
  };

  const filtered = q || status !== 'semua';

  return (
    <>
      <AdminPageHeader
        title="Testimoni"
        description="Pilih testimoni peserta yang tampil di halaman utama, rapikan isinya, atau hapus."
        actions={
          <Button variant="secondary" icon={<RefreshCw />} onClick={() => reload()}>
            Muat ulang
          </Button>
        }
        meta={
          <>
            <StatusPill tone="warning">{counts.pending} menunggu</StatusPill>
            <StatusPill tone="mint">{counts.published} ditampilkan</StatusPill>
            <StatusPill tone="mist">{counts.semua} total</StatusPill>
          </>
        }
      />

      <SectionToggle />

      <Panel padding="none" className="overflow-hidden">
        <FilterBar
          left={
            <Segmented
              size="sm"
              ariaLabel="Status testimoni"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'semua', label: 'Semua', count: counts.semua },
                { value: 'pending', label: 'Menunggu', count: counts.pending },
                { value: 'published', label: 'Ditampilkan', count: counts.published },
                { value: 'hidden', label: 'Disembunyikan', count: counts.hidden },
              ]}
            />
          }
          right={<SearchInput size="sm" className="sm:w-72" placeholder="Cari nama, email, isi…" onSearch={setQ} ariaLabel="Cari testimoni" />}
        />

        {loading && !data ? (
          <div className="divide-y divide-mist-100">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex gap-4 p-4 sm:p-5">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2.5">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState className="m-5" error={error} onRetry={() => reload()} />
        ) : items.length === 0 ? (
          <EmptyState
            className="m-5 py-10"
            icon={<MessageSquareQuote />}
            title={filtered ? 'Tidak ada testimoni yang cocok' : 'Belum ada testimoni'}
            description={filtered ? 'Ubah tab status atau kata kunci pencarian.' : 'Testimoni yang ditulis peserta dari halaman /testimoni akan muncul di sini.'}
          />
        ) : (
          <ul className={cn('divide-y divide-mist-100', loading && 'opacity-60 transition-opacity')} aria-busy={loading || undefined}>
            {items.map((t) => (
              <TestimonialRow
                key={t.id}
                t={t}
                busy={busyId === t.id}
                onToggle={(show) => toggleShown(t, show)}
                onEdit={() => setEditing(t)}
                onDelete={() => setToDelete(t)}
              />
            ))}
          </ul>
        )}
      </Panel>

      <EditModal
        t={editing}
        onClose={() => setEditing(null)}
        onSaved={(next, prevStatus) => {
          replaceLocal(next, prevStatus);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        tone="danger"
        title="Hapus testimoni ini?"
        description={toDelete ? `Testimoni dari ${toDelete.user?.name || 'peserta'} akan dihapus permanen${toDelete.status === 'published' ? ' dan hilang dari halaman utama' : ''}.` : ''}
        confirmText="Ya, hapus"
        icon={<Trash2 className="h-[22px] w-[22px]" />}
      />
    </>
  );
}

function TestimonialRow({ t, busy, onToggle, onEdit, onDelete }) {
  const conf = TESTIMONI_STATUS[t.status] || TESTIMONI_STATUS.pending;
  const isNew = t.status === 'pending' && !t.is_read;
  const shown = t.status === 'published';
  return (
    <li className={cn('relative flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-mist-50/60 sm:px-5 lg:flex-row lg:items-start', isNew && 'bg-cobalt-50/40')}>
      {isNew && <span className="absolute inset-y-0 left-0 w-[3px] bg-cobalt" aria-hidden />}
      <div className="flex min-w-0 flex-1 gap-3.5">
        <Avatar name={t.user?.name} src={t.user?.avatar_url} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-sm font-semibold text-obsidian">{t.user?.name}</p>
            {isNew && (
              <Badge tone="cobalt" size="sm" variant="soft" dot={false}>
                Baru
              </Badge>
            )}
            <Badge tone={conf.tone} size="sm">
              {conf.short}
            </Badge>
          </div>
          <p className="truncate text-xs text-mist-700">{t.user?.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={t.rating} size="sm" />
            <span className="text-xs font-semibold tabular-nums text-obsidian-600">{t.rating}/5</span>
          </div>
          <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-[14px] leading-relaxed text-obsidian" title={t.content}>
            {t.content}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-mist-700">
            <span title={formatTanggalJam(t.created_at)}>Dikirim {formatRelatif(t.created_at)}</span>
            {t.updated_at && t.updated_at !== t.created_at && <span title={formatTanggalJam(t.updated_at)}>Diperbarui {formatRelatif(t.updated_at)}</span>}
            {shown && t.published_at && <span>Tampil sejak {formatTanggal(t.published_at)}</span>}
            {t.edited_by_admin && (
              <span className="inline-flex items-center gap-1 font-medium text-cobalt-700">
                <PencilLine className="h-3 w-3" aria-hidden /> Diedit admin
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-mist-100 pt-3 pl-[54px] lg:flex-col lg:items-end lg:border-0 lg:pl-0 lg:pt-0">
        <span className="inline-flex items-center gap-2.5">
          <label htmlFor={`tampil-${t.id}`} className={cn('cursor-pointer text-[13px] font-medium', shown ? 'text-obsidian' : 'text-mist-700')}>
            Tampilkan<span className="sr-only"> testimoni {t.user?.name} di halaman utama</span>
          </label>
          <Switch id={`tampil-${t.id}`} checked={shown} disabled={busy} onChange={onToggle} />
        </span>
        <div className="flex items-center gap-1 max-sm:gap-2">
          <IconButton icon={<PencilLine />} label="Edit testimoni" variant="ghost" size="sm" onClick={onEdit} />
          <IconButton icon={<Trash2 />} label="Hapus testimoni" variant="ghost" size="sm" className="text-danger-700" onClick={onDelete} />
        </div>
      </div>
    </li>
  );
}

function EditModal({ t, onClose, onSaved }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('pending');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!t) return;
    setRating(t.rating);
    setContent(t.content);
    setStatus(t.status);
    setErrors({});
  }, [t]);

  const len = testimoniLength(content);
  const norm = normalizeTestimoni(content);
  const changed = t && (rating !== t.rating || norm !== t.content || status !== t.status);

  const save = async () => {
    if (!t) return;
    const f = {};
    if (len < TESTIMONI_MIN) f.content = `Testimoni minimal ${TESTIMONI_MIN} karakter.`;
    else if (len > TESTIMONI_MAX) f.content = `Testimoni maksimal ${TESTIMONI_MAX} karakter.`;
    setErrors(f);
    if (Object.keys(f).length) return;
    const body = {};
    if (rating !== t.rating) body.rating = rating;
    if (norm !== t.content) body.content = norm;
    if (status !== t.status) body.status = status;
    setSaving(true);
    try {
      const r = await api.patch(`/admin/testimonials/${t.id}`, body);
      onSaved(r.testimonial, t.status);
      toast.success('Testimoni diperbarui');
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error('Gagal menyimpan testimoni', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!t}
      onClose={saving ? () => {} : onClose}
      size="md"
      title={<ModalTitle icon={<PencilLine />}>Edit testimoni</ModalTitle>}
      description={t ? `Dari ${t.user?.name || 'peserta'} · ${formatTanggal(t.created_at)}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button variant="accent" onClick={save} loading={saving} disabled={!changed}>
            Simpan
          </Button>
        </>
      }
    >
      {t && (
        <div className="space-y-5">
          <Field label="Penilaian" error={errors.rating}>
            <StarInput value={rating} onChange={setRating} size="md" disabled={saving} invalid={!!errors.rating} />
          </Field>
          <div>
            <Field label="Isi testimoni" error={errors.content}>
              <Textarea
                rows={6}
                value={content}
                disabled={saving}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errors.content) setErrors((x) => ({ ...x, content: undefined }));
                }}
              />
            </Field>
            <CharCounter length={len} className="mt-1.5" />
          </div>
          <Field label="Status" error={errors.status}>
            <Segmented
              size="sm"
              fullWidth
              ariaLabel="Status testimoni"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'pending', label: 'Menunggu' },
                { value: 'published', label: 'Ditampilkan' },
                { value: 'hidden', label: 'Disembunyikan' },
              ]}
            />
          </Field>
          <p className="rounded-xl bg-ghost px-3.5 py-2.5 text-[12px] leading-relaxed text-mist-700">
            Mengubah bintang atau isi akan menandai testimoni sebagai <b className="font-semibold text-obsidian-600">diedit admin</b>. Peserta tetap dapat mengubahnya kembali (lalu
            menunggu tinjauan ulang).
          </p>
        </div>
      )}
    </Modal>
  );
}

export default TestimoniView;

/**
 * Switch tampil/sembunyikan section "Testimoni" di halaman utama (site.sections.testimoni.visible).
 * Membaca data situs tersimpan apa adanya lalu menyimpan ulang utuh (PUT /admin/site menimpa).
 */
function SectionToggle() {
  const toast = useToast();
  const { setSite } = useSiteActions();
  const [raw, setRaw] = useState(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .get('/site')
      .then((d) => setRaw(d?.site && typeof d.site === 'object' ? d.site : {}))
      .catch(() => setFailed(true));
  }, []);

  const visible = raw?.sections?.testimoni?.visible !== false;

  const toggle = async (next) => {
    if (!raw) return;
    const site = { ...raw, sections: { ...(raw.sections || {}), testimoni: { ...(raw.sections?.testimoni || {}), visible: next } } };
    setSaving(true);
    try {
      const d = await api.put('/admin/site', site);
      const saved = d?.site || site;
      setRaw(saved);
      setSite(saved);
      toast.success(next ? 'Section testimoni ditampilkan' : 'Section testimoni disembunyikan', next ? 'Testimoni kembali tampil di halaman utama.' : 'Section & link navbar "Testimoni" tidak tampil di halaman utama.');
    } catch (e) {
      toast.error('Gagal menyimpan', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel padding="none" className="mb-4 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3.5">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', visible ? 'bg-cobalt-50 text-cobalt ring-cobalt-100' : 'bg-ghost text-mist-700 ring-mist-100')}>
          {visible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-obsidian sm:text-[15px]">Section testimoni di halaman utama</p>
          <p className="mt-0.5 text-sm text-mist-700">
            {failed ? 'Gagal memuat pengaturan website.' : visible ? 'Sedang ditampilkan di bawah section Fitur, termasuk link di navbar.' : 'Sedang disembunyikan — section dan link navbar tidak tampil.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:shrink-0">
        <Button variant="ghost" size="sm" icon={<ExternalLink />} href="/#testimoni" target="_blank" rel="noopener">
          Lihat
        </Button>
        <span className="h-6 w-px bg-mist-100" aria-hidden />
        <label htmlFor="section-testimoni" className="text-sm font-medium text-obsidian">
          {visible ? 'Ditampilkan' : 'Disembunyikan'}
        </label>
        <Switch id="section-testimoni" checked={visible} disabled={!raw || saving} onChange={toggle} aria-label="Tampilkan section testimoni" />
      </div>
    </Panel>
  );
}
