'use client';

import { useEffect, useId, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Hourglass, MessageSquareQuote, PencilLine, Quote, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatRelatif, formatTanggal } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useAuth } from '@/components/providers/AuthProvider';
import { useResource } from '@/components/peserta/hooks';
import { Avatar, Badge, Button, ConfirmDialog, ErrorState, Field, Textarea, useToast } from '@/components/ui';
import { BrandName } from '@/components/layout/Logo';
import { CharCounter, normalizeTestimoni, RATING_LABELS, StarInput, StarRating, TESTIMONI_MAX, TESTIMONI_MIN, TESTIMONI_STATUS, testimoniLength } from '@/components/testimoni/Stars';
import { IconBox, PageHead, Panel, PanelHeader, PanelSkeleton } from '../_components/kit';

const CRUMBS = [{ href: '/dashboard', label: 'Dashboard' }, { label: 'Testimoni' }];
const STATUS_ICON = { pending: Hourglass, published: Eye, hidden: EyeOff };

/** Halaman peserta: tulis / ubah / hapus testimoni sendiri (docs/TESTIMONI.md). */
export function TestimoniView() {
  const { user } = useAuth();
  const toast = useToast();
  const res = useResource(() => api.get('/me/testimonial'), []);
  const saved = res.data?.testimonial || null;

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const counterId = useId();

  // Isi form dari data tersimpan setiap kali data dimuat ulang.
  useEffect(() => {
    setRating(saved?.rating || 0);
    setContent(saved?.content || '');
    setErrors({});
  }, [saved]);

  const len = testimoniLength(content);
  const dirty = !saved || rating !== saved.rating || normalizeTestimoni(content) !== saved.content;

  const submit = async (e) => {
    e.preventDefault();
    const f = {};
    if (!rating) f.rating = 'Pilih penilaian 1–5 bintang.';
    if (len < TESTIMONI_MIN) f.content = `Testimoni minimal ${TESTIMONI_MIN} karakter.`;
    else if (len > TESTIMONI_MAX) f.content = `Testimoni maksimal ${TESTIMONI_MAX} karakter.`;
    setErrors(f);
    if (Object.keys(f).length) return;
    setSaving(true);
    try {
      const data = await api.put('/me/testimonial', { rating, content: normalizeTestimoni(content) });
      res.setData(data);
      toast.success(saved ? 'Testimoni diperbarui' : 'Testimoni terkirim', 'Admin akan meninjau sebelum ditampilkan di halaman utama.');
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      toast.error('Gagal menyimpan testimoni', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await api.del('/me/testimonial');
      res.setData({ testimonial: null });
      toast.success('Testimoni dihapus');
      return true;
    } catch (err) {
      toast.error('Gagal menghapus testimoni', errorMessage(err));
      return false;
    }
  };

  const reset = () => {
    setRating(saved?.rating || 0);
    setContent(saved?.content || '');
    setErrors({});
  };

  const head = (
    <PageHead
      crumbs={CRUMBS}
      mascot="/maskot/dashboard.webp"
      title="Testimoni"
      description="Ceritakan pengalaman belajar Anda. Testimoni pilihan admin akan tampil di halaman utama."
      meta={saved ? <StatusChip status={saved.status} /> : null}
    />
  );

  if (res.loading && !res.data) {
    return (
      <>
        {head}
        <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
          <PanelSkeleton className="lg:col-span-7" height="h-72" />
          <PanelSkeleton className="lg:col-span-5" height="h-56" />
        </div>
      </>
    );
  }

  if (res.error && !res.data) {
    return (
      <>
        {head}
        <Panel padding="none">
          <ErrorState error={res.error} onRetry={() => res.reload()} title="Testimoni gagal dimuat" />
        </Panel>
      </>
    );
  }

  return (
    <>
      {head}

      <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        {/* ---------- Form ---------- */}
        <Panel as="form" onSubmit={submit} noValidate className="lg:col-span-7">
          <PanelHeader
            title={saved ? 'Ubah testimoni Anda' : 'Tulis testimoni'}
            subtitle={saved ? `Dikirim ${formatTanggal(saved.created_at)}${saved.updated_at !== saved.created_at ? ` · diperbarui ${formatRelatif(saved.updated_at)}` : ''}` : 'Satu testimoni per akun. Anda bisa mengubahnya kapan saja.'}
          />

          {saved && <StatusNote t={saved} />}

          <div className="space-y-5">
            <Field label="Penilaian Anda" required error={errors.rating}>
              <StarInput
                value={rating}
                onChange={(n) => {
                  setRating(n);
                  if (errors.rating) setErrors((e) => ({ ...e, rating: undefined }));
                }}
                invalid={!!errors.rating}
                disabled={saving}
              />
            </Field>

            <Field
              label="Cerita Anda"
              required
              error={errors.content}
              hint="Contoh: materi yang paling membantu, pengalaman tryout, atau perubahan skor Anda."
            >
              <Textarea
                rows={6}
                value={content}
                maxLength={TESTIMONI_MAX + 200}
                disabled={saving}
                placeholder="Tulis pengalaman Anda berlatih di sini…"
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errors.content) setErrors((x) => ({ ...x, content: undefined }));
                }}
              />
            </Field>
            <CharCounter id={counterId} length={len} className="-mt-3" />

            <div className="flex flex-col-reverse gap-2 border-t border-mist-100 pt-5 sm:flex-row sm:items-center">
              {saved && (
                <Button type="button" variant="danger-soft" icon={<Trash2 />} onClick={() => setConfirmDelete(true)} disabled={saving}>
                  Hapus testimoni
                </Button>
              )}
              <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
                {saved && dirty && (
                  <Button type="button" variant="ghost" onClick={reset} disabled={saving}>
                    Batalkan perubahan
                  </Button>
                )}
                <Button type="submit" variant="accent" icon={<Save />} loading={saving} disabled={!dirty}>
                  {saved ? 'Simpan perubahan' : 'Kirim testimoni'}
                </Button>
              </div>
            </div>
          </div>
        </Panel>

        {/* ---------- Pratinjau + info ---------- */}
        <div className="space-y-4 lg:col-span-5">
          <Panel>
            <PanelHeader title="Pratinjau" subtitle="Seperti ini testimoni Anda tampil di halaman utama." />
            <PreviewCard name={user?.name || 'Peserta'} avatar={user?.avatar_url} rating={rating} content={normalizeTestimoni(content)} />
          </Panel>

          <Panel>
            <div className="flex gap-3">
              <IconBox icon={ShieldCheck} tone="cobalt" />
              <div className="min-w-0 text-[13px] leading-relaxed text-mist-700">
                <p className="text-sm font-semibold text-obsidian">Bagaimana testimoni ditinjau?</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>Testimoni baru atau yang diubah berstatus <b className="font-semibold text-obsidian">Menunggu ditinjau</b>.</li>
                  <li>Admin memilih testimoni yang ditampilkan dan dapat merapikan ejaan.</li>
                  <li>Yang ditampilkan hanya nama, foto profil, bintang, dan isi testimoni.</li>
                  <li>Gunakan bahasa yang sopan; kata kasar akan ditolak.</li>
                </ul>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        tone="danger"
        title="Hapus testimoni Anda?"
        description="Testimoni akan dihapus permanen dan tidak lagi tampil di halaman utama. Anda bisa menulis yang baru kapan saja."
        confirmText="Ya, hapus"
        icon={<Trash2 className="h-[22px] w-[22px]" />}
      />
    </>
  );
}

/** Chip status testimoni (Menunggu ditinjau / Ditampilkan / Disembunyikan). */
export function StatusChip({ status, short }) {
  const conf = TESTIMONI_STATUS[status] || TESTIMONI_STATUS.pending;
  return <Badge tone={conf.tone}>{short ? conf.short : conf.label}</Badge>;
}

function StatusNote({ t }) {
  const Icon = STATUS_ICON[t.status] || Hourglass;
  const text = {
    pending: 'Testimoni Anda sedang menunggu ditinjau admin. Setelah disetujui, testimoni akan tampil di halaman utama.',
    published: `Testimoni Anda tampil di halaman utama${t.published_at ? ` sejak ${formatTanggal(t.published_at)}` : ''}. Mengubahnya akan mengirim ulang untuk ditinjau.`,
    hidden: 'Testimoni Anda saat ini tidak ditampilkan di halaman utama. Anda dapat mengubahnya untuk ditinjau ulang.',
  }[t.status];
  return (
    <div
      className={cn(
        'mb-5 flex items-start gap-2.5 rounded-2xl px-4 py-3 text-[13px] leading-relaxed',
        t.status === 'published' ? 'bg-mint-50 text-mint-700' : t.status === 'hidden' ? 'bg-ghost text-mist-700' : 'bg-cobalt-50 text-cobalt-700',
      )}
    >
      {t.status === 'published' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
      <div className="min-w-0">
        <p>{text}</p>
        {t.edited_by_admin && (
          <p className="mt-1 inline-flex items-center gap-1 font-medium">
            <PencilLine className="h-3.5 w-3.5" aria-hidden /> Isi testimoni ini telah disunting admin.
          </p>
        )}
      </div>
    </div>
  );
}

/** Kartu pratinjau (meniru kartu testimoni di halaman utama). */
function PreviewCard({ name, avatar, rating, content }) {
  const empty = !content;
  const label = rating ? RATING_LABELS[rating] : null;
  return (
    <figure className="relative overflow-hidden rounded-[20px] bg-white p-5 ring-1 ring-inset ring-cobalt-100">
      <Quote aria-hidden className="absolute right-4 top-4 h-10 w-10 fill-cobalt-50 text-cobalt-100" strokeWidth={1.25} />
      <div className="flex items-center gap-2">
        <StarRating value={rating} size="sm" />
        {label && <span className="text-xs font-medium text-mist-700">{label}</span>}
      </div>
      <blockquote className={cn('mt-3 whitespace-pre-line break-words text-[14px] leading-relaxed', empty ? 'italic text-mist-500' : 'text-obsidian')}>
        {empty ? 'Isi testimoni Anda akan tampil di sini…' : `“${content}”`}
      </blockquote>
      <figcaption className="mt-4 flex items-center gap-3 border-t border-mist-100 pt-4">
        <Avatar name={name} src={avatar} size="md" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-obsidian">{name}</span>
          <span className="block text-xs text-mist-700">
            Peserta <BrandName />
          </span>
        </span>
        <MessageSquareQuote className="ml-auto h-4 w-4 shrink-0 text-cobalt" aria-hidden />
      </figcaption>
    </figure>
  );
}

export default TestimoniView;
