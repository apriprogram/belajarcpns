'use client';

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, CloudUpload, Eye, ImagePlus, Save, Trash2, Undo2 } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAngka } from '@/lib/format';
import { Button, Field, Select, Spinner, Switch, Textarea, useToast } from '@/components/ui';
import { FormAlert } from '@/components/auth/AuthParts';
import { QuestionPreview } from './QuestionPreview';
import { Panel, PanelHeader } from './AdminUI';
import { Segmented } from './Segmented';
import { DIFFICULTY_OPTIONS, LABELS, SUBTESTS, SUBTEST_NAME } from './shared';

const BODY_MAX = 2000;
const TKP_DEFAULT = [5, 4, 3, 2, 1];

function fromQuestion(q) {
  if (!q) {
    return {
      subtest: 'TWK',
      category_id: '',
      difficulty: 'sedang',
      status: 'draft',
      body: '',
      image_url: '',
      explanation: '',
      options: LABELS.map(() => ({ body: '', weight: 0 })),
    };
  }
  const opts = LABELS.map((l, i) => {
    const o = (q.options || []).find((x) => x.label === l) || q.options?.[i] || {};
    return { body: o.body || '', weight: Number(o.weight) || 0 };
  });
  return {
    subtest: q.subtest || 'TWK',
    category_id: q.category_id ? String(q.category_id) : '',
    difficulty: q.difficulty || 'sedang',
    status: q.status || 'draft',
    body: q.body || '',
    image_url: q.image_url || '',
    explanation: q.explanation || '',
    options: opts,
  };
}

/**
 * Form soal bersama untuk /admin/soal/baru dan /admin/soal/[id].
 * question: data soal (mode ubah) atau null (mode baru) · onSaved(question)
 */
export function QuestionForm({ question, onSaved }) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = !!question?.id;
  const [v, setV] = useState(() => fromQuestion(question));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(null); // 'stay' | 'back'
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const fileRef = useRef(null);
  const initialRef = useRef(JSON.stringify(fromQuestion(question)));

  useEffect(() => {
    let alive = true;
    api
      .get('/admin/categories')
      .then((d) => alive && setCategories(d || []))
      .catch(() => alive && setCategories([]))
      .finally(() => alive && setCatLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const subCats = useMemo(() => categories.filter((c) => c.parent_id && c.code === v.subtest), [categories, v.subtest]);
  const isTKP = v.subtest === 'TKP';
  const dirty = JSON.stringify(v) !== initialRef.current;

  const clearErr = (...keys) =>
    setErrors((e) => {
      if (!keys.some((k) => e[k])) return e;
      const n = { ...e };
      keys.forEach((k) => delete n[k]);
      return n;
    });

  const set = (name, value) => {
    setV((s) => ({ ...s, [name]: value }));
    clearErr(name);
    setFormError(null);
  };

  const setSubtest = (code) => {
    setV((s) => {
      if (s.subtest === code) return s;
      let options = s.options;
      if (code === 'TKP') {
        const valid = s.options.every((o) => o.weight >= 1 && o.weight <= 5);
        options = valid ? s.options : s.options.map((o, i) => ({ ...o, weight: TKP_DEFAULT[i] }));
      } else {
        const max = Math.max(...s.options.map((o) => o.weight));
        const keyIdx = s.subtest === 'TKP' ? -1 : s.options.findIndex((o) => o.weight === max && max > 0);
        options = s.options.map((o, i) => ({ ...o, weight: i === keyIdx ? 5 : 0 }));
      }
      const catOk = categories.some((c) => String(c.id) === s.category_id && c.code === code);
      return { ...s, subtest: code, options, category_id: catOk ? s.category_id : '' };
    });
    clearErr('subtest', 'options', ...LABELS.map((l) => `options.${l}`));
  };

  const setOption = (i, patch) => {
    setV((s) => ({ ...s, options: s.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) }));
    clearErr(`options.${LABELS[i]}`, 'options');
  };

  const setKey = (i) => {
    setV((s) => ({ ...s, options: s.options.map((o, j) => ({ ...o, weight: j === i ? 5 : 0 })) }));
    clearErr('options');
  };

  const keyIndex = !isTKP ? v.options.findIndex((o) => o.weight === 5) : -1;
  const dupWeights = useMemo(() => {
    if (!isTKP) return [];
    const seen = {};
    v.options.forEach((o) => (seen[o.weight] = (seen[o.weight] || 0) + 1));
    return Object.keys(seen)
      .filter((k) => seen[k] > 1)
      .map(Number);
  }, [isTKP, v.options]);

  const validate = () => {
    const e = {};
    if (v.body.trim().length < 5) e.body = 'Teks soal minimal 5 karakter.';
    if (v.body.length > BODY_MAX) e.body = `Teks soal maksimal ${BODY_MAX} karakter.`;
    v.options.forEach((o, i) => {
      if (!o.body.trim()) e[`options.${LABELS[i]}`] = `Opsi ${LABELS[i]} wajib diisi.`;
      if (isTKP && (o.weight < 1 || o.weight > 5)) e[`options.${LABELS[i]}`] = `Bobot opsi ${LABELS[i]} harus 1–5.`;
    });
    if (!isTKP && keyIndex === -1) e.options = 'Pilih satu kunci jawaban (opsi benar bernilai 5).';
    return e;
  };

  const onUpload = async (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
      toast.error('Format tidak didukung', 'Gunakan gambar PNG, JPG, GIF, atau WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Gambar terlalu besar', 'Ukuran maksimal 2 MB.');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.upload('/admin/uploads', fd);
      set('image_url', r.url);
      toast.success('Gambar diunggah');
    } catch (err) {
      toast.error('Gagal mengunggah gambar', errorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (mode) => {
    const e = validate();
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) {
      setFormError('Periksa kembali isian yang ditandai.');
      const first = Object.keys(e)[0];
      document.getElementById(`qf-${first.replace('.', '-')}`)?.focus();
      return;
    }
    setSaving(mode);
    const payload = {
      subtest: v.subtest,
      category_id: v.category_id ? Number(v.category_id) : null,
      body: v.body.trim(),
      image_url: v.image_url,
      difficulty: v.difficulty,
      explanation: v.explanation.trim(),
      status: v.status,
      options: v.options.map((o, i) => ({ label: LABELS[i], body: o.body.trim(), weight: Number(o.weight) || 0 })),
    };
    try {
      const saved = isEdit ? await api.put(`/admin/questions/${question.id}`, payload) : await api.post('/admin/questions', payload);
      initialRef.current = JSON.stringify(v);
      toast.success(isEdit ? 'Soal diperbarui' : 'Soal ditambahkan', excerptBody(payload.body));
      onSaved && onSaved(saved);
      if (mode === 'back') router.push('/admin/soal');
      else if (!isEdit && saved?.id) router.replace(`/admin/soal/${saved.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields);
        setFormError(err.message || 'Periksa kembali isian yang ditandai.');
      } else {
        setFormError(errorMessage(err));
      }
      toast.error('Gagal menyimpan soal', errorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const catName = categories.find((c) => String(c.id) === v.category_id)?.name;
  const preview = { ...v, category_name: catName, options: v.options.map((o, i) => ({ ...o, label: LABELS[i] })) };

  const actions = (
    <div className="flex gap-2 sm:flex-row lg:flex-col xl:flex-row">
      <Button variant="secondary" fullWidth icon={<Save />} loading={saving === 'stay'} disabled={!!saving} onClick={() => submit('stay')} className="max-sm:!w-auto max-sm:shrink-0">
        <span className="sm:hidden">Simpan</span>
        <span className="max-sm:hidden">Simpan &amp; tetap</span>
      </Button>
      <Button fullWidth icon={<Check />} loading={saving === 'back'} disabled={!!saving} onClick={() => submit('back')}>
        Simpan &amp; kembali
      </Button>
    </div>
  );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit('stay');
      }}
      className="grid gap-3 sm:gap-4 lg:grid-cols-12"
    >
      <div className="space-y-3 sm:space-y-4 min-w-0 lg:col-span-7">
        {formError && <FormAlert title="Soal belum dapat disimpan">{formError}</FormAlert>}

        <Panel padding="lg">
          <PanelHeader title="Informasi soal" subtitle="Subtes menentukan aturan penilaian opsi." />
          <div className="space-y-5">
            <Field label="Subtes" required error={errors.subtest}>
              <Segmented
                id="qf-subtest"
                ariaLabel="Subtes"
                fullWidth
                value={v.subtest}
                onChange={setSubtest}
                options={SUBTESTS.map((s) => ({ value: s, label: s }))}
              />
            </Field>
            <p className="-mt-2 text-[13px] text-mist-700">{SUBTEST_NAME[v.subtest]} · {isTKP ? 'setiap opsi berbobot 1–5' : 'jawaban benar 5, salah 0'}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Sub-kategori" optional error={errors.category_id} hint={catLoading ? 'Memuat kategori…' : !subCats.length ? `Belum ada sub-kategori ${v.subtest}.` : undefined}>
                <Select
                  value={v.category_id}
                  onChange={(e) => set('category_id', e.target.value)}
                  placeholder="Tanpa sub-kategori"
                  disabled={catLoading}
                  options={subCats.map((c) => ({ value: String(c.id), label: c.name }))}
                />
              </Field>
              <Field label="Tingkat kesulitan" error={errors.difficulty}>
                <Segmented ariaLabel="Tingkat kesulitan" fullWidth value={v.difficulty} onChange={(x) => set('difficulty', x)} options={DIFFICULTY_OPTIONS} />
              </Field>
            </div>
            <div className="rounded-xl bg-ghost p-4">
              <Switch
                checked={v.status === 'terbit'}
                onChange={(on) => set('status', on ? 'terbit' : 'draft')}
                label={v.status === 'terbit' ? 'Terbit' : 'Draf'}
                description={v.status === 'terbit' ? 'Soal dapat dipakai di latihan dan paket ujian.' : 'Soal disimpan sebagai draf dan belum tampil ke peserta.'}
              />
            </div>
          </div>
        </Panel>

        <Panel padding="lg">
          <PanelHeader title="Teks soal" subtitle="Tulis pertanyaan dengan jelas. Gambar opsional." />
          <Field
            label="Pertanyaan"
            required
            id="qf-body"
            error={errors.body}
            labelAction={
              <span className={cn('font-mono text-xs tabular-nums', v.body.length > BODY_MAX ? 'text-danger-700' : 'text-mist-500')} aria-live="polite">
                {formatAngka(v.body.length)}/{formatAngka(BODY_MAX)}
              </span>
            }
          >
            <Textarea rows={7} value={v.body} onChange={(e) => set('body', e.target.value)} placeholder="Contoh: Rumusan Pancasila yang sah tercantum dalam …" className="min-h-[180px]" />
          </Field>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-obsidian">
              Gambar <span className="font-normal text-mist-500">(opsional)</span>
            </p>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" id="qf-image" onChange={(e) => onUpload(e.target.files?.[0])} />
            {v.image_url ? (
              <div className="flex flex-col gap-4 rounded-2xl p-3 ring-1 ring-inset ring-mist-100 sm:flex-row sm:items-center">
                <img src={v.image_url} alt="Pratinjau gambar soal" className="h-28 w-full rounded-xl bg-ghost object-contain sm:w-44" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-mist-700">{v.image_url}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" icon={<ImagePlus />} loading={uploading} onClick={() => fileRef.current?.click()}>
                      Ganti
                    </Button>
                    <Button size="sm" variant="danger-soft" icon={<Trash2 />} onClick={() => set('image_url', '')}>
                      Hapus gambar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                htmlFor="qf-image"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onUpload(e.dataTransfer.files?.[0]);
                }}
                className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-mist bg-mist-50 px-4 py-7 text-center transition-colors hover:border-mist-500 focus-within:border-cobalt focus-within:ring-2 focus-within:ring-cobalt/30"
              >
                {uploading ? <Spinner tone="cobalt" /> : <CloudUpload className="h-8 w-8 text-mist-500" strokeWidth={1.5} aria-hidden />}
                <span className="mt-2 text-sm font-semibold">{uploading ? 'Mengunggah…' : 'Pilih gambar atau seret ke sini'}</span>
                <span className="text-xs text-mist-700">PNG, JPG, GIF, WEBP · maks. 2 MB</span>
              </label>
            )}
          </div>
        </Panel>

        <Panel padding="lg">
          <PanelHeader
            title="Opsi jawaban"
            subtitle={isTKP ? 'Beri bobot 1–5 untuk setiap opsi. Idealnya setiap bobot berbeda.' : 'Pilih satu kunci jawaban. Kunci otomatis bernilai 5, opsi lain 0.'}
          />
          {errors.options && (
            <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {errors.options}
            </p>
          )}
          {isTKP && dupWeights.length > 0 && (
            <p role="status" className="mb-4 flex items-start gap-2 rounded-xl bg-warning-50 px-4 py-3 text-sm text-warning-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Bobot {dupWeights.join(', ')} dipakai lebih dari satu opsi. Bobot unik (5–1) membuat penilaian TKP lebih adil.
            </p>
          )}
          <fieldset>
            <legend className="sr-only">{isTKP ? 'Opsi dan bobot' : 'Opsi dan kunci jawaban'}</legend>
            <ul className="space-y-3">
              {LABELS.map((label, i) => {
                const o = v.options[i];
                const err = errors[`options.${label}`];
                const isKey = !isTKP && o.weight === 5;
                return (
                  <li
                    key={label}
                    className={cn(
                      'rounded-xl p-3 ring-1 ring-inset transition-colors sm:p-4',
                      err ? 'bg-danger-50/50 ring-danger/30' : isKey ? 'bg-mint-50 ring-mint-100' : 'bg-white ring-mist-100',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn('mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold', isKey ? 'bg-mint text-obsidian' : 'bg-ghost text-obsidian-600')}>
                        {label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`qf-options-${label}`} className="sr-only">
                          Teks opsi {label}
                        </label>
                        <Textarea
                          id={`qf-options-${label}`}
                          rows={2}
                          value={o.body}
                          state={err ? 'error' : undefined}
                          aria-describedby={err ? `qf-options-${label}-err` : undefined}
                          onChange={(e) => setOption(i, { body: e.target.value })}
                          placeholder={`Tulis opsi ${label}`}
                          className="min-h-[52px] py-2.5 text-sm"
                        />
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          {isTKP ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-mist-700" id={`qf-w-${label}`}>
                                Bobot
                              </span>
                              <Segmented
                                size="sm"
                                ariaLabel={`Bobot opsi ${label}`}
                                value={o.weight}
                                onChange={(w) => setOption(i, { weight: w })}
                                options={[1, 2, 3, 4, 5].map((w) => ({
                                  value: w,
                                  label: <span className="font-mono tabular-nums">{w}</span>,
                                  activeClass: dupWeights.includes(w) ? 'bg-warning text-obsidian' : 'bg-obsidian text-white',
                                }))}
                              />
                            </div>
                          ) : (
                            <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm font-medium">
                              <input
                                type="radio"
                                name="qf-key"
                                checked={isKey}
                                onChange={() => setKey(i)}
                                className="h-5 w-5 cursor-pointer appearance-none rounded-full border border-mist bg-white transition-colors checked:border-[6px] checked:border-mint-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/20"
                              />
                              {isKey ? <span className="text-mint-700">Kunci jawaban · 5 poin</span> : <span className="text-obsidian-600">Jadikan kunci</span>}
                            </label>
                          )}
                        </div>
                        {err && (
                          <p id={`qf-options-${label}-err`} role="alert" className="mt-2 text-[13px] text-danger-700">
                            {err}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </Panel>

        <Panel padding="lg">
          <PanelHeader title="Pembahasan" subtitle="Ditampilkan kepada peserta setelah menjawab atau selesai ujian." />
          <Field label="Pembahasan" optional error={errors.explanation}>
            <Textarea rows={5} value={v.explanation} onChange={(e) => set('explanation', e.target.value)} placeholder="Jelaskan mengapa jawaban tersebut benar…" />
          </Field>
        </Panel>

        <div className="lg:hidden">
          <Button variant="ghost" size="sm" icon={<Eye />} onClick={() => setShowPreviewMobile((s) => !s)} aria-expanded={showPreviewMobile}>
            {showPreviewMobile ? 'Sembunyikan pratinjau' : 'Lihat pratinjau peserta'}
          </Button>
          {showPreviewMobile && (
            <Panel className="mt-3">
              <QuestionPreview question={preview} number={1} compact />
            </Panel>
          )}
        </div>
      </div>

      <aside className="min-w-0 lg:col-span-5">
        <div className="space-y-4 lg:sticky lg:top-20">
          <Panel padding="lg" className="hidden lg:block">
            <PanelHeader
              title="Pratinjau langsung"
              subtitle="Tampilan soal bagi peserta (kunci hanya untuk admin)."
              action={
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-mint-700 ring-1 ring-inset ring-mint-700/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint-700" aria-hidden /> Live
                </span>
              }
            />
            <div className="max-h-[calc(100vh-22rem)] overflow-y-auto rounded-2xl bg-ghost p-4 sm:p-5">
              <QuestionPreview question={preview} number={1} compact />
            </div>
          </Panel>
          <Panel padding="sm" className="sticky bottom-3 z-10 shadow-float max-sm:bottom-[calc(80px+env(safe-area-inset-bottom))] lg:static lg:shadow-none">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-mist-700">{dirty ? 'Ada perubahan belum disimpan' : isEdit ? 'Semua perubahan tersimpan' : 'Soal baru'}</span>
              {dirty && isEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setV(JSON.parse(initialRef.current));
                    setErrors({});
                    setFormError(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-full text-xs font-semibold text-cobalt hover:text-cobalt-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Urungkan
                </button>
              )}
            </div>
            {actions}
          </Panel>
        </div>
      </aside>
    </form>
  );
}

function excerptBody(s) {
  return s.length > 60 ? `${s.slice(0, 59)}…` : s;
}

export default QuestionForm;
