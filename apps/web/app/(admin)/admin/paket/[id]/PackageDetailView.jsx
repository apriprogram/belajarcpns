'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Archive, ArrowDown, ArrowUp, BarChart3, FileQuestion, ListPlus, Save, Send, Sparkles, Trash2, Undo2, Users, Wand2, X } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAngka, formatTanggalJam } from '@/lib/format';
import {
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  Modal,
  ProgressBar,
  Skeleton,
  Switch,
  Textarea,
  useToast,
} from '@/components/ui';
import { FormAlert } from '@/components/auth/AuthParts';
import { CompositionBar, SubtestChip } from '@/components/admin/AdminParts';
import { QuestionPickerModal } from '@/components/admin/QuestionPickerModal';
import { AdminPageHeader, ModalTitle, Panel, PanelHeader, StatusPill } from '@/components/admin/AdminUI';
import { SKD_TARGET, SUBTESTS, SUBTEST_NAME, shortCode, toLocalInput, useResource } from '@/components/admin/shared';

const PASS_FIELDS = [
  ['pass_twk', 'TWK', 150],
  ['pass_tiu', 'TIU', 175],
  ['pass_tkp', 'TKP', 225],
  ['pass_total', 'Total', 550],
];

function toForm(p) {
  return {
    title: p.title || '',
    description: p.description || '',
    duration_minutes: String(p.duration_minutes ?? 100),
    start_at: toLocalInput(p.start_at),
    end_at: toLocalInput(p.end_at),
    shuffle_questions: !!p.shuffle_questions,
    shuffle_options: !!p.shuffle_options,
    pass_twk: String(p.pass_twk ?? 0),
    pass_tiu: String(p.pass_tiu ?? 0),
    pass_tkp: String(p.pass_tkp ?? 0),
    pass_total: String(p.pass_total ?? 0),
  };
}

export function PackageDetailView() {
  const { id } = useParams();
  const toast = useToast();
  const pkg = useResource(() => api.get(`/admin/packages/${id}`), [id]);
  const p = pkg.data;

  const [form, setForm] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [savingForm, setSavingForm] = useState(false);
  const [items, setItems] = useState([]);
  const [savedIds, setSavedIds] = useState('');
  const [savingItems, setSavingItems] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const [statusBusy, setStatusBusy] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [toRemove, setToRemove] = useState(null);

  useEffect(() => {
    if (!p) return;
    setForm(toForm(p));
    setItems(p.questions || []);
    setSavedIds((p.questions || []).map((q) => q.id).join(','));
  }, [p]);

  const ids = items.map((q) => q.id).join(',');
  const itemsDirty = ids !== savedIds;
  const formDirty = form && p && JSON.stringify(form) !== JSON.stringify(toForm(p));
  const counts = useMemo(() => {
    const c = { TWK: 0, TIU: 0, TKP: 0 };
    items.forEach((q) => (c[q.subtest] = (c[q.subtest] || 0) + 1));
    return c;
  }, [items]);
  const existingIds = useMemo(() => new Set(items.map((q) => q.id)), [items]);
  const draftInPkg = items.filter((q) => q.status !== 'terbit').length;

  const setF = (k) => (e) => {
    const val = e && e.target ? e.target.value : e;
    setForm((s) => ({ ...s, [k]: val }));
    setFormErrors((x) => ({ ...x, [k]: undefined }));
  };

  const saveForm = async (e) => {
    e.preventDefault();
    const err = {};
    if (form.title.trim().length < 3) err.title = 'Judul paket minimal 3 karakter.';
    const dur = Number(form.duration_minutes);
    if (!Number.isFinite(dur) || dur < 1 || dur > 600) err.duration_minutes = 'Durasi 1–600 menit.';
    if (form.start_at && form.end_at && form.end_at <= form.start_at) err.end_at = 'Jadwal selesai harus setelah jadwal mulai.';
    PASS_FIELDS.forEach(([k, , max]) => {
      const n = Number(form[k]);
      if (!Number.isFinite(n) || n < 0 || n > max) err[k] = `0–${max}`;
    });
    setFormErrors(err);
    setFormError(null);
    if (Object.keys(err).length) return;
    setSavingForm(true);
    try {
      await api.put(`/admin/packages/${id}`, {
        title: form.title.trim(),
        description: form.description.trim(),
        duration_minutes: dur,
        start_at: form.start_at || null,
        end_at: form.end_at || null,
        shuffle_questions: form.shuffle_questions,
        shuffle_options: form.shuffle_options,
        pass_twk: Number(form.pass_twk),
        pass_tiu: Number(form.pass_tiu),
        pass_tkp: Number(form.pass_tkp),
        pass_total: Number(form.pass_total),
      });
      toast.success('Pengaturan paket disimpan');
      await refreshKeepingItems();
    } catch (e2) {
      if (e2 instanceof ApiError && e2.fields) setFormErrors(e2.fields);
      setFormError(errorMessage(e2));
      toast.error('Gagal menyimpan', errorMessage(e2));
    } finally {
      setSavingForm(false);
    }
  };

  // Muat ulang paket tanpa membuang susunan soal yang belum disimpan.
  const refreshKeepingItems = async () => {
    const keep = itemsDirty ? items : null;
    const fresh = await api.get(`/admin/packages/${id}`);
    pkg.setData(fresh);
    if (keep) setTimeout(() => setItems(keep), 0);
  };

  const saveItems = async (list = items, msg = 'Susunan soal disimpan') => {
    setSavingItems(true);
    try {
      await api.put(`/admin/packages/${id}/questions`, { question_ids: list.map((q) => q.id) });
      toast.success(msg, `${formatAngka(list.length)} soal di paket ini.`);
      const fresh = await api.get(`/admin/packages/${id}`);
      pkg.setData(fresh);
      return true;
    } catch (err) {
      toast.error('Gagal menyimpan soal paket', err.fields?.question_ids || errorMessage(err));
      return false;
    } finally {
      setSavingItems(false);
    }
  };

  const move = (i, d) =>
    setItems((s) => {
      const j = i + d;
      if (j < 0 || j >= s.length) return s;
      const n = [...s];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const changeStatus = async (status) => {
    setStatusBusy(status);
    try {
      if (status === 'terbit' && itemsDirty) {
        const ok = await saveItems(items);
        if (!ok) return;
      }
      const r = await api.patch(`/admin/packages/${id}/status`, { status });
      pkg.setData((d) => ({ ...d, ...r, questions: d.questions }));
      toast.success({ terbit: 'Paket diterbitkan', draft: 'Paket dijadikan draf', arsip: 'Paket diarsipkan' }[status], p.title);
    } catch (err) {
      toast.error('Gagal mengubah status', err.fields?.status || errorMessage(err));
    } finally {
      setStatusBusy(null);
    }
  };

  if (pkg.error) {
    return (
      <div>
        <AdminPageHeader back={{ href: '/admin/paket', label: 'Paket ujian' }} title="Kelola paket" />
        <Panel padding="none" className="overflow-hidden">
          {pkg.error.status === 404 ? (
            <EmptyState icon={<FileQuestion />} title="Paket tidak ditemukan" description="Paket mungkin sudah dihapus." action={<Button href="/admin/paket">Kembali ke daftar paket</Button>} />
          ) : (
            <ErrorState error={pkg.error} onRetry={() => pkg.reload()} />
          )}
        </Panel>
      </div>
    );
  }

  if (!p || !form) {
    return (
      <div>
        <AdminPageHeader back={{ href: '/admin/paket', label: 'Paket ujian' }} title="Memuat paket…" />
        <div className="grid gap-4 lg:grid-cols-12">
          <Skeleton className="h-96 min-w-0 lg:col-span-5" rounded="rounded-[20px]" />
          <Skeleton className="h-96 min-w-0 lg:col-span-7" rounded="rounded-[20px]" />
        </div>
      </div>
    );
  }

  const statusActions = (
    <>
      <Button variant="secondary" icon={<BarChart3 />} href={`/admin/laporan?paket=${p.id}`}>
        Laporan
      </Button>
      {p.status === 'terbit' ? (
        <>
          <Button variant="secondary" icon={<Undo2 />} loading={statusBusy === 'draft'} disabled={!!statusBusy} onClick={() => setConfirmStatus('draft')}>
            Jadikan draf
          </Button>
          <Button variant="secondary" icon={<Archive />} loading={statusBusy === 'arsip'} disabled={!!statusBusy} onClick={() => setConfirmStatus('arsip')}>
            Arsipkan
          </Button>
        </>
      ) : (
        <>
          {p.status === 'draft' && (
            <Button variant="secondary" icon={<Archive />} loading={statusBusy === 'arsip'} disabled={!!statusBusy} onClick={() => setConfirmStatus('arsip')}>
              Arsipkan
            </Button>
          )}
          {p.status === 'arsip' && (
            <Button variant="secondary" icon={<Undo2 />} loading={statusBusy === 'draft'} disabled={!!statusBusy} onClick={() => changeStatus('draft')}>
              Jadikan draf
            </Button>
          )}
          <Button variant="accent" icon={<Send />} loading={statusBusy === 'terbit'} disabled={!!statusBusy || !items.length} onClick={() => setConfirmStatus('terbit')} title={!items.length ? 'Isi soal terlebih dahulu' : undefined}>
            Terbitkan
          </Button>
        </>
      )}
    </>
  );

  return (
    <div>
      <AdminPageHeader
        back={{ href: '/admin/paket', label: 'Paket ujian' }}
        title={p.title}
        description={p.description || 'Atur detail paket dan susun soal dari bank soal.'}
        meta={
          <>
            <Chip size="sm" color="white" mono className="!shadow-none ring-1 ring-inset ring-mist-100">
              {shortCode(p.id)}
            </Chip>
            <StatusPill status={p.status} />
            <Chip size="sm" color="cobalt" icon={<Users />}>
              {formatAngka(p.attempts_count)} peserta
            </Chip>
            <span className="text-xs text-mist-700">Diperbarui {formatTanggalJam(p.updated_at)}</span>
          </>
        }
        actions={statusActions}
      />

      {p.attempts_count > 0 && (
        <FormAlert tone="info" title="Paket sudah dikerjakan peserta" className="mb-4">
          Perubahan soal tidak memengaruhi hasil yang sudah tercatat, tetapi membuat perbandingan antarpeserta kurang adil. Pertimbangkan membuat paket baru.
        </FormAlert>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Pengaturan */}
        <Panel padding="lg" className="h-fit lg:col-span-5">
          <PanelHeader title="Pengaturan paket" subtitle="Judul, jadwal, dan passing grade." />
          <form onSubmit={saveForm} noValidate className="space-y-5">
            {formError && <FormAlert>{formError}</FormAlert>}
            <Field label="Judul" required error={formErrors.title}>
              <Input value={form.title} onChange={setF('title')} maxLength={150} />
            </Field>
            <Field label="Deskripsi" optional error={formErrors.description}>
              <Textarea rows={3} value={form.description} onChange={setF('description')} />
            </Field>
            <Field label="Durasi (menit)" required error={formErrors.duration_minutes} hint="Standar SKD: 100 menit.">
              <Input type="number" min={1} max={600} inputMode="numeric" value={form.duration_minutes} onChange={setF('duration_minutes')} mono />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              <Field label="Jadwal mulai" optional error={formErrors.start_at}>
                <Input type="datetime-local" value={form.start_at} onChange={setF('start_at')} />
              </Field>
              <Field label="Jadwal selesai" optional error={formErrors.end_at}>
                <Input type="datetime-local" value={form.end_at} onChange={setF('end_at')} />
              </Field>
            </div>
            <p className="-mt-2 text-xs text-mist-700">Waktu dalam WIB. Kosongkan agar paket dapat dikerjakan kapan saja.</p>
            <div className="space-y-4 rounded-xl bg-ghost p-4">
              <Switch checked={form.shuffle_questions} onChange={setF('shuffle_questions')} label="Acak urutan soal" description="Setiap peserta mendapat urutan soal berbeda." />
              <div className="h-px bg-mist-100" />
              <Switch checked={form.shuffle_options} onChange={setF('shuffle_options')} label="Acak urutan opsi" description="Opsi A–E ditampilkan dalam urutan acak." />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Passing grade</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {PASS_FIELDS.map(([k, l, max]) => (
                  <div key={k}>
                    <label htmlFor={`pg-${k}`} className="mb-1.5 block text-xs text-mist-700">
                      {l} <span className="text-mist-500">/ {max}</span>
                    </label>
                    <Input id={`pg-${k}`} size="sm" type="number" min={0} max={max} inputMode="numeric" value={form[k]} onChange={setF(k)} state={formErrors[k] ? 'error' : undefined} mono />
                    {formErrors[k] && <p className="mt-1 text-[11px] text-danger-700">{formErrors[k]}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-mist-100 pt-5">
              <span className="text-xs text-mist-700">{formDirty ? 'Ada perubahan belum disimpan' : 'Tersimpan'}</span>
              <Button type="submit" icon={<Save />} loading={savingForm} disabled={!formDirty}>
                Simpan pengaturan
              </Button>
            </div>
          </form>
        </Panel>

        {/* Soal */}
        <div className="space-y-4 min-w-0 lg:col-span-7">
          <Panel padding="lg">
            <PanelHeader title="Komposisi vs target SKD" info="Komposisi standar SKD" subtitle="Target standar 30 TWK · 35 TIU · 45 TKP (110 soal)." />
            <CompositionBar counts={counts} total={110} showLegend={false} />
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
              {SUBTESTS.map((k) => {
                const n = counts[k] || 0;
                const t = SKD_TARGET[k];
                return (
                  <div key={k} className="min-w-0 rounded-xl p-3 ring-1 ring-inset ring-mist-100 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <SubtestChip code={k} />
                      <span className={cn('text-xs font-semibold', n === t ? 'text-mint-700' : n > t ? 'text-warning-700' : 'text-mist-700')}>
                        {n === t ? 'Sesuai' : n > t ? `+${n - t}` : `−${t - n}`}
                      </span>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tabular-nums">
                      {n}
                      <span className="text-sm font-medium text-mist-500">/{t}</span>
                    </p>
                    <ProgressBar value={n} max={t} size="sm" color={n === t ? 'mint-dark' : n > t ? 'warning' : 'cobalt'} className="mt-2" />
                    <p className="mt-2 hidden truncate text-[11px] text-mist-700 sm:block">{SUBTEST_NAME[k]}</p>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel padding="none" className="overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:p-6 sm:pb-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]">Soal dalam paket</h2>
                <p className="mt-0.5 text-[13px] text-mist-700">
                  {formatAngka(items.length)} soal · urutan menentukan nomor soal{p.shuffle_questions ? ' (diacak saat ujian)' : ''}.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button variant="secondary" size="sm" icon={<Wand2 />} onClick={() => setAutoOpen(true)}>
                  Isi otomatis
                </Button>
                <Button size="sm" icon={<ListPlus />} onClick={() => setPickerOpen(true)}>
                  Tambah dari bank soal
                </Button>
              </div>
            </div>

            {itemsDirty && (
              <div className="mx-4 mb-3 flex flex-col gap-3 rounded-xl bg-warning-50 px-4 py-3 sm:mx-6 sm:flex-row sm:items-center">
                <p className="flex-1 text-sm text-warning-700">Susunan soal berubah dan belum disimpan.</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setItems(p.questions || [])} disabled={savingItems}>
                    Batalkan
                  </Button>
                  <Button size="sm" icon={<Save />} loading={savingItems} onClick={() => saveItems()}>
                    Simpan susunan
                  </Button>
                </div>
              </div>
            )}
            {draftInPkg > 0 && (
              <p className="mx-4 mb-3 rounded-xl bg-ghost px-4 py-3 text-sm text-obsidian-600 sm:mx-6">
                {draftInPkg} soal berstatus draf. Soal draf tetap tampil di ujian paket ini.
              </p>
            )}

            {!items.length ? (
              <div className="px-4 pb-6 sm:px-6">
                <EmptyState
                  variant="dashed"
                  size="sm"
                  icon={<Sparkles />}
                  title="Paket belum memiliki soal"
                  description="Isi otomatis sesuai komposisi SKD atau pilih soal satu per satu dari bank soal."
                  action={
                    <>
                      <Button size="sm" variant="secondary" icon={<Wand2 />} onClick={() => setAutoOpen(true)}>
                        Isi otomatis
                      </Button>
                      <Button size="sm" icon={<ListPlus />} onClick={() => setPickerOpen(true)}>
                        Pilih soal
                      </Button>
                    </>
                  }
                />
              </div>
            ) : (
              <ol className="max-h-[720px] divide-y divide-mist-100 overflow-y-auto border-t border-mist-100" aria-label="Urutan soal paket">
                {items.map((q, i) => (
                  <li key={q.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-mist-50 sm:px-6">
                    <span className="w-8 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-mist-700">{i + 1}</span>
                    <SubtestChip code={q.subtest} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={q.body}>
                        {q.body}
                      </p>
                      <p className="truncate text-xs text-mist-700">
                        {q.category_name || 'Tanpa sub-kategori'} · {q.difficulty}
                        {q.status !== 'terbit' && <span className="font-semibold text-warning-700"> · draf</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5 sm:opacity-60 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <IconButton icon={<ArrowUp />} label={`Naikkan soal ${i + 1}`} variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, -1)} />
                      <IconButton icon={<ArrowDown />} label={`Turunkan soal ${i + 1}`} variant="ghost" size="sm" disabled={i === items.length - 1} onClick={() => move(i, 1)} />
                      <IconButton icon={<X />} label={`Keluarkan soal ${i + 1} dari paket`} variant="ghost" size="sm" className="hover:!bg-danger-50 hover:!text-danger" onClick={() => setToRemove(q)} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>

      <QuestionPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        existingIds={existingIds}
        adding={savingItems}
        onAdd={async (qs) => {
          const next = [...items, ...qs.map((q) => ({ id: q.id, subtest: q.subtest, category_name: q.category_name, body: q.body, difficulty: q.difficulty, status: q.status }))];
          setItems(next);
          const ok = await saveItems(next, `${qs.length} soal ditambahkan`);
          if (ok) setPickerOpen(false);
          return ok;
        }}
      />

      <AutoFillModal
        open={autoOpen}
        onClose={() => setAutoOpen(false)}
        hasItems={items.length > 0}
        onDone={async () => {
          const fresh = await api.get(`/admin/packages/${id}`);
          pkg.setData(fresh);
        }}
        packageId={id}
      />

      <ConfirmDialog
        open={!!toRemove}
        onClose={() => setToRemove(null)}
        title="Keluarkan soal dari paket?"
        description="Soal tetap tersimpan di bank soal. Simpan susunan untuk menerapkan perubahan."
        confirmText="Keluarkan"
        tone="danger"
        icon={<Trash2 className="h-[22px] w-[22px]" />}
        onConfirm={() => {
          setItems((s) => s.filter((q) => q.id !== toRemove.id));
        }}
      />

      <ConfirmDialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        tone={confirmStatus === 'terbit' ? 'default' : 'danger'}
        title={{ terbit: 'Terbitkan paket ini?', draft: 'Jadikan paket draf?', arsip: 'Arsipkan paket ini?' }[confirmStatus] || ''}
        description={
          {
            terbit: `Paket dengan ${items.length} soal akan tampil ke peserta${p.start_at ? ` sesuai jadwal (${formatTanggalJam(p.start_at)})` : ' dan dapat langsung dikerjakan'}.${itemsDirty ? ' Susunan soal yang belum disimpan akan disimpan terlebih dahulu.' : ''}`,
            draft: 'Paket disembunyikan dari peserta. Ujian yang sedang berlangsung tetap dapat diselesaikan.',
            arsip: 'Paket disembunyikan dari peserta, tetapi riwayat hasil dan laporannya tetap tersimpan.',
          }[confirmStatus]
        }
        confirmText={{ terbit: 'Ya, terbitkan', draft: 'Ya, jadikan draf', arsip: 'Ya, arsipkan' }[confirmStatus]}
        onConfirm={() => changeStatus(confirmStatus)}
      />
    </div>
  );
}

function AutoFillModal({ open, onClose, onDone, packageId, hasItems }) {
  const toast = useToast();
  const [v, setV] = useState({ twk: '30', tiu: '35', tkp: '45' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [stock, setStock] = useState(null);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    api
      .get('/admin/settings')
      .then((s) => s?.composition && setV({ twk: String(s.composition.twk), tiu: String(s.composition.tiu), tkp: String(s.composition.tkp) }))
      .catch(() => {});
    Promise.all(SUBTESTS.map((s) => api.list('/admin/questions', { query: { subtest: s, status: 'terbit', per_page: 1 } })))
      .then((r) => setStock(Object.fromEntries(SUBTESTS.map((s, i) => [s, r[i].meta?.total ?? 0]))))
      .catch(() => setStock(null));
  }, [open]);

  const total = ['twk', 'tiu', 'tkp'].reduce((a, k) => a + (Number(v[k]) || 0), 0);

  const run = async () => {
    const e = {};
    ['twk', 'tiu', 'tkp'].forEach((k) => {
      const n = Number(v[k]);
      if (!Number.isInteger(n) || n < 0) e[k] = 'Bilangan bulat ≥ 0';
      else if (stock && n > stock[k.toUpperCase()]) e[k] = `Stok terbit hanya ${stock[k.toUpperCase()]}`;
    });
    if (!total) e.twk = e.twk || 'Isi minimal satu subtes';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.post(`/admin/packages/${packageId}/auto-fill`, { twk: Number(v.twk), tiu: Number(v.tiu), tkp: Number(v.tkp) });
      toast.success('Paket diisi otomatis', `${total} soal acak dari bank soal terbit.`);
      await onDone();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error('Isi otomatis gagal', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title={<ModalTitle icon={<Wand2 />}>Isi paket sesuai komposisi</ModalTitle>}
      description="Soal dipilih acak dari bank soal berstatus terbit."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button icon={<Wand2 />} onClick={run} loading={busy}>
            Isi {total} soal
          </Button>
        </>
      }
    >
      {hasItems && (
        <FormAlert tone="info" className="mb-5">
          Isi paket saat ini akan <strong>diganti</strong> seluruhnya.
        </FormAlert>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {SUBTESTS.map((s) => {
          const k = s.toLowerCase();
          return (
            <Field key={s} label={<span className="flex items-center gap-2"><SubtestChip code={s} /> soal</span>} error={errors[k]} hint={stock ? `Stok terbit: ${stock[s]}` : 'Memuat stok…'}>
              <Input type="number" min={0} inputMode="numeric" value={v[k]} onChange={(e) => { setV((x) => ({ ...x, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); }} mono aria-label={`Jumlah soal ${s}`} />
            </Field>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between rounded-xl bg-ghost px-4 py-3 text-sm">
        <span className="text-mist-700">Total soal</span>
        <span className={cn('font-mono font-semibold tabular-nums', total === 110 ? 'text-mint-700' : 'text-obsidian')}>{total}{total === 110 ? ' · standar SKD' : ''}</span>
      </div>
      <button type="button" className="mt-3 text-sm font-semibold text-cobalt hover:text-cobalt-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40" onClick={() => setV({ twk: '30', tiu: '35', tkp: '45' })}>
        Gunakan komposisi SKD 30/35/45
      </button>
    </Modal>
  );
}

export default PackageDetailView;
