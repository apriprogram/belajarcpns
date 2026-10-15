'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileStack } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { Button, DateTimeField, Field, Input, Modal, Textarea, useToast } from '@/components/ui';
import { FormAlert } from '@/components/auth/AuthParts';
import { ModalTitle } from './AdminUI';

const EMPTY = { title: '', description: '', duration_minutes: '100', start_at: '', end_at: '', pass_twk: '65', pass_tiu: '80', pass_tkp: '166', pass_total: '0' };

/** Modal "Buat paket": membuat paket draft lalu membuka halaman kelola paket. */
export function PackageFormModal({ open, onClose, onCreated }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setErrors({});
    setFormError(null);
    setV(EMPTY);
    api
      .get('/admin/settings')
      .then((s) => {
        if (!alive || !s) return;
        setV((x) => ({
          ...x,
          duration_minutes: String(s.default_duration ?? x.duration_minutes),
          pass_twk: String(s.passing_grade?.twk ?? x.pass_twk),
          pass_tiu: String(s.passing_grade?.tiu ?? x.pass_tiu),
          pass_tkp: String(s.passing_grade?.tkp ?? x.pass_tkp),
          pass_total: String(s.passing_grade?.total ?? x.pass_total),
        }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [open]);

  const set = (k) => (e) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (v.title.trim().length < 3) err.title = 'Judul paket minimal 3 karakter.';
    const dur = Number(v.duration_minutes);
    if (!Number.isFinite(dur) || dur < 1 || dur > 600) err.duration_minutes = 'Durasi 1–600 menit.';
    if (v.start_at && v.end_at && v.end_at <= v.start_at) err.end_at = 'Jadwal selesai harus setelah jadwal mulai.';
    setErrors(err);
    if (Object.keys(err).length) return;
    setSaving(true);
    setFormError(null);
    try {
      const pkg = await api.post('/admin/packages', {
        title: v.title.trim(),
        description: v.description.trim(),
        duration_minutes: dur,
        start_at: v.start_at || null,
        end_at: v.end_at || null,
        shuffle_questions: false,
        shuffle_options: false,
        pass_twk: Number(v.pass_twk) || 0,
        pass_tiu: Number(v.pass_tiu) || 0,
        pass_tkp: Number(v.pass_tkp) || 0,
        pass_total: Number(v.pass_total) || 0,
      });
      toast.success('Paket dibuat', 'Lanjutkan dengan mengisi soal paket.');
      onCreated && onCreated(pkg);
      onClose && onClose();
      if (pkg?.id) router.push(`/admin/paket/${pkg.id}`);
    } catch (e2) {
      if (e2 instanceof ApiError && e2.fields) setErrors(e2.fields);
      setFormError(errorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={<ModalTitle icon={<FileStack />}>Buat paket baru</ModalTitle>}
      description="Paket dibuat sebagai draf. Soal dapat diisi otomatis atau dipilih dari bank soal setelahnya."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="pkg-create" icon={<FileStack />} loading={saving}>
            Buat paket
          </Button>
        </>
      }
    >
      <form id="pkg-create" onSubmit={submit} noValidate className="space-y-5">
        {formError && <FormAlert>{formError}</FormAlert>}
        <Field label="Judul paket" required error={errors.title}>
          <Input value={v.title} onChange={set('title')} placeholder="mis. Tryout SKD Nasional #3" maxLength={150} data-autofocus />
        </Field>
        <Field label="Deskripsi" optional error={errors.description}>
          <Textarea rows={3} value={v.description} onChange={set('description')} placeholder="Ringkasan singkat untuk peserta" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Durasi (menit)" required error={errors.duration_minutes} className="sm:col-span-2 sm:max-w-[220px]">
            <Input type="number" min={1} max={600} inputMode="numeric" value={v.duration_minutes} onChange={set('duration_minutes')} mono />
          </Field>
          <Field label="Mulai" optional error={errors.start_at}>
            <DateTimeField label="Jadwal mulai" value={v.start_at} onChange={(x) => set('start_at')({ target: { value: x } })} placeholder="Kapan saja" />
          </Field>
          <Field label="Selesai" optional error={errors.end_at}>
            <DateTimeField label="Jadwal selesai" value={v.end_at} onChange={(x) => set('end_at')({ target: { value: x } })} placeholder="Tanpa batas" min={v.start_at ? v.start_at.slice(0, 10) : undefined} defaultTime="20:00" align="end" />
          </Field>
        </div>
        <div className="border-t border-mist-100 pt-5">
          <p className="text-[15px] font-semibold">Passing grade</p>
          <p className="mb-3 mt-0.5 text-sm text-mist-700">Ambang lulus per subtes dan total.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['pass_twk', 'TWK'],
              ['pass_tiu', 'TIU'],
              ['pass_tkp', 'TKP'],
              ['pass_total', 'Total'],
            ].map(([k, l]) => (
              <Field key={k} label={<span className="text-xs text-mist-700">{l}</span>} error={errors[k]}>
                <Input type="number" min={0} inputMode="numeric" size="sm" value={v[k]} onChange={set(k)} mono aria-label={`Passing grade ${l}`} />
              </Field>
            ))}
          </div>
          <p className="mt-2 text-xs text-mist-700">Nilai awal diambil dari Pengaturan. Total 0 berarti tidak ada ambang total.</p>
        </div>
      </form>
    </Modal>
  );
}

export default PackageFormModal;
