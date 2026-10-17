'use client';

import { useMemo, useState } from 'react';
import { Check, Clock3, ListChecks, Plus, SignalHigh, SignalLow, SignalMedium, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api, errorMessage } from '@/lib/api';
import { isoDay } from '@/lib/format';
import { useForm, rules } from '@/lib/useForm';
import { Button, Chip, ConfirmDialog, Field, IconButton, Input, Modal, SegmentedProgress, Select, Skeleton, useToast } from '@/components/ui';
import { SUBTEST_TONE } from '@/components/peserta/constants';
import { FormAlert } from '@/components/auth/AuthParts';
import { Panel, PanelHeader } from '../_components/kit';

const PRIORITY = {
  tinggi: { label: 'Tinggi', icon: SignalHigh },
  sedang: { label: 'Sedang', icon: SignalMedium },
  rendah: { label: 'Rendah', icon: SignalLow },
};
const SUBTEST_OPTIONS = [
  { value: 'TWK', label: 'TWK — Wawasan Kebangsaan' },
  { value: 'TIU', label: 'TIU — Intelegensia Umum' },
  { value: 'TKP', label: 'TKP — Karakteristik Pribadi' },
  { value: 'SKD', label: 'SKD — Umum' },
];
const SUBTEST_LABEL = { TWK: 'TWK', TIU: 'TIU', TKP: 'TKP', SKD: 'Umum' };

const fmtTime = (t = '') => String(t).slice(0, 5).replace(':', '.');

/** Kartu "Target Harian": timeline jam + kartu tugas berwarna per subtes. */
export function TargetsCard({ targets, setTargets, loading }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState({});

  const sorted = useMemo(() => [...(targets || [])].sort((a, b) => String(a.due_time).localeCompare(String(b.due_time))), [targets]);
  const done = sorted.filter((t) => t.done).length;

  const toggle = async (t) => {
    setBusy((b) => ({ ...b, [t.id]: true }));
    setTargets((list) => list.map((x) => (x.id === t.id ? { ...x, done: !t.done } : x)));
    try {
      const updated = await api.patch(`/me/targets/${t.id}`, { done: !t.done });
      if (updated && updated.id) setTargets((list) => list.map((x) => (x.id === t.id ? updated : x)));
      if (!t.done) toast.success('Target selesai', t.title);
    } catch (err) {
      setTargets((list) => list.map((x) => (x.id === t.id ? { ...x, done: t.done } : x)));
      toast.error('Gagal memperbarui target', errorMessage(err));
    } finally {
      setBusy((b) => ({ ...b, [t.id]: false }));
    }
  };

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title="Target harian"
        info="Target belajar untuk hari ini. Centang bila sudah selesai."
        subtitle={loading ? 'Memuat…' : sorted.length ? `${done} dari ${sorted.length} target selesai` : 'Rencanakan belajar Anda hari ini'}
        action={
          <Button variant="accent" size="sm" icon={<Plus />} onClick={() => setAdding(true)} className="!shadow-none">
            Target baru
          </Button>
        }
      />
      {!loading && sorted.length > 0 && <SegmentedProgress total={sorted.length} value={done} showCount={false} className="mb-4" />}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-11" rounded="rounded-md" />
              <Skeleton className="h-[72px] flex-1" rounded="rounded-2xl" />
            </div>
          ))}
        </div>
      ) : !sorted.length ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-mist-100 px-6 py-10 text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-ghost text-obsidian-600">
            <ListChecks className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm font-semibold sm:text-base">Belum ada target hari ini</p>
          <p className="mt-1 max-w-xs text-sm text-mist-700">Tambahkan target kecil, mis. &ldquo;20 soal TIU deret angka&rdquo;, agar belajar lebih terarah.</p>
          <Button variant="secondary" size="sm" icon={<Plus />} className="mt-4 !shadow-none" onClick={() => setAdding(true)}>
            Tambah target
          </Button>
        </div>
      ) : (
        <ol className="relative max-h-[392px] space-y-2.5 overflow-y-auto pr-1" aria-label="Daftar target hari ini">
          {sorted.map((t, i) => {
            const tone = SUBTEST_TONE[t.subtest] || SUBTEST_TONE.SKD;
            const P = PRIORITY[t.priority] || PRIORITY.sedang;
            return (
              <li key={t.id} className="flex gap-3 sm:gap-4">
                <div className="flex w-11 shrink-0 flex-col items-center pt-1">
                  <span className="font-mono text-xs font-medium tabular-nums text-mist-700">{fmtTime(t.due_time)}</span>
                  {i < sorted.length - 1 && <span className="mt-2 w-px flex-1 border-l-2 border-dashed border-mist-100" aria-hidden />}
                </div>
                <div className={cn('group flex min-w-0 flex-1 items-start gap-3 rounded-2xl p-3.5 ring-1 ring-inset transition-opacity', tone.bg, tone.ring, t.done && 'opacity-70')}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={!!t.done}
                    aria-label={`Tandai "${t.title}" ${t.done ? 'belum selesai' : 'selesai'}`}
                    disabled={busy[t.id]}
                    onClick={() => toggle(t)}
                    className={cn(
                      'relative mt-0.5 flex h-6 w-6 shrink-0 items-center before:absolute before:-inset-2.5 sm:before:hidden justify-center rounded-lg ring-2 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-cobalt',
                      t.done ? 'bg-mint-700 text-white ring-mint-700' : 'bg-white ring-mist hover:ring-obsidian-600',
                    )}
                  >
                    {t.done && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm font-semibold leading-snug text-obsidian', t.done && 'line-through decoration-2')}>{t.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-obsidian-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden />
                        Pukul {fmtTime(t.due_time)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <P.icon className="h-3.5 w-3.5" aria-hidden />
                        Prioritas {P.label.toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="hidden rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-obsidian-600 ring-1 ring-inset ring-mist-100 sm:inline-flex">{SUBTEST_LABEL[t.subtest] || t.subtest}</span>
                    <IconButton icon={<Trash2 />} label={`Hapus target ${t.title}`} variant="ghost" size="sm" onClick={() => setToDelete(t)} />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <AddTargetModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(t) => {
          setTargets((list) => [...(list || []), t]);
          toast.success('Target ditambahkan', t.title);
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        tone="danger"
        title="Hapus target ini?"
        description={toDelete ? `“${toDelete.title}” akan dihapus dari daftar hari ini.` : ''}
        onConfirm={async () => {
          try {
            await api.del(`/me/targets/${toDelete.id}`);
            setTargets((list) => list.filter((x) => x.id !== toDelete.id));
            toast.success('Target dihapus');
          } catch (err) {
            toast.error('Gagal menghapus', errorMessage(err));
            return false;
          }
        }}
      />
    </Panel>
  );
}

function AddTargetModal({ open, onClose, onCreated }) {
  const form = useForm({
    initial: { title: '', subtest: 'TWK', due_time: '09:00', priority: 'sedang' },
    validate: (v) => ({
      title: rules.required(v.title, 'Judul target') || (v.title.trim().length < 3 ? 'Minimal 3 karakter' : null),
      due_time: !v.due_time ? 'Jam wajib diisi' : null,
    }),
  });
  const close = () => {
    form.reset();
    onClose();
  };
  const onSubmit = form.handleSubmit(async (v) => {
    const t = await api.post('/me/targets', { ...v, title: v.title.trim(), day: isoDay() });
    onCreated(t);
    close();
  });
  return (
    <Modal
      open={open}
      onClose={close}
      className="max-sm:pb-[env(safe-area-inset-bottom)]"
      eyebrow="Target harian"
      title="Tambah target baru"
      description="Target berlaku untuk hari ini dan tampil di timeline dashboard."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Batal
          </Button>
          <Button type="submit" form="form-target" loading={form.submitting} icon={<Plus />}>
            Simpan target
          </Button>
        </>
      }
    >
      <form id="form-target" onSubmit={onSubmit} noValidate className="space-y-5">
        {form.formError && <FormAlert>{form.formError}</FormAlert>}
        <Field label="Judul target" required {...form.field('title')}>
          <Input placeholder="mis. Latihan 20 soal TIU deret angka" maxLength={120} data-autofocus {...form.bind('title')} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Subtes" {...form.field('subtest')}>
            <Select options={SUBTEST_OPTIONS} {...form.bind('subtest')} />
          </Field>
          <Field label="Jam" required {...form.field('due_time')}>
            <Input type="time" mono {...form.bind('due_time')} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-obsidian">Prioritas</legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRIORITY).map(([k, p]) => (
              <Chip key={k} size="lg" icon={<p.icon />} onClick={() => form.setValue('priority', k)} selected={form.values.priority === k} color="white">
                {p.label}
              </Chip>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}

export default TargetsCard;
