'use client';

import { useState } from 'react';
import { ArrowRight, BookOpen, Briefcase, CheckCircle2, Code2, GraduationCap, Headset, Search, Store } from 'lucide-react';
import { api } from '@/lib/api';
import { rules, useForm } from '@/lib/useForm';
import { Button, Field, Input, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';
import { Reveal } from './Motion';

export const OCCUPATIONS = [
  { value: 'siswa', label: 'Siswa', icon: BookOpen },
  { value: 'mahasiswa', label: 'Mahasiswa', icon: GraduationCap },
  { value: 'bekerja', label: 'Sudah bekerja', icon: Briefcase },
  { value: 'belum_bekerja', label: 'Belum bekerja', icon: Search },
  { value: 'pengusaha', label: 'Pengusaha', icon: Store },
];

const RECIPIENTS = [
  { value: 'admin', label: 'Admin', desc: 'Akun, tryout, soal', icon: Headset },
  { value: 'developer', label: 'Developer', desc: 'Bug & saran fitur', icon: Code2 },
];

const MAX = 1000;

/** Formulir "Kirim pesan" di halaman utama → tersimpan untuk admin/developer (menu Pesan masuk). */
export function ContactForm() {
  const { brand } = useSite();
  const [sent, setSent] = useState(null);
  const form = useForm({
    initial: { name: '', occupation: '', recipient: 'admin', contact: '', body: '', website: '' },
    validate: (v) => ({
      name: rules.required(v.name, 'Nama lengkap') || (v.name.trim().length < 3 ? 'Nama minimal 3 karakter' : null),
      occupation: !v.occupation ? 'Pilih status Anda' : null,
      body: !v.body.trim() ? 'Pesan wajib diisi' : v.body.trim().length < 10 ? 'Pesan minimal 10 karakter' : v.body.length > MAX ? `Pesan maksimal ${MAX} karakter` : null,
    }),
  });

  const onSubmit = form.handleSubmit(async (v) => {
    await api.post('/messages', {
      name: v.name.trim(),
      occupation: v.occupation,
      recipient: v.recipient,
      contact: v.contact.trim(),
      body: v.body.trim(),
      website: v.website,
    });
    setSent({ name: v.name.trim().split(/\s+/)[0], recipient: v.recipient });
    form.reset();
  });

  if (sent) {
    return (
      <div className="flex min-h-[460px] animate-scale-in flex-col items-center justify-center rounded-[24px] bg-white p-8 text-center ring-1 ring-inset ring-mist-100">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mint-50 text-mint-700">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h3 className="mt-6 text-2xl font-semibold tracking-tight">Terima kasih, {sent.name}!</h3>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-mist-700">
          Pesan Anda sudah diterima {sent.recipient === 'developer' ? 'tim developer' : 'admin'}. Kami akan membacanya secepatnya.
        </p>
        <Button shape="pill" variant="secondary" className="mt-8" onClick={() => setSent(null)}>
          Kirim pesan lain
        </Button>
      </div>
    );
  }

  const occErr = form.errorOf('occupation');
  const len = form.values.body.length;

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[24px] bg-white p-6 ring-1 ring-inset ring-mist-100 sm:p-8">
      {form.formError && <p className="mb-5 rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-700">{form.formError}</p>}

      {/* Tujuan */}
      <fieldset>
        <legend className="text-sm font-medium">Kirim ke</legend>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup">
          {RECIPIENTS.map((r) => {
            const on = form.values.recipient === r.value;
            const Icon = r.icon;
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => form.setValue('recipient', r.value)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
                  on ? 'bg-cobalt-50 ring-cobalt/40' : 'bg-white ring-mist-100 hover:bg-mist-50',
                )}
              >
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', on ? 'bg-cobalt text-white' : 'bg-ghost text-obsidian-600')}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{r.label}</span>
                  <span className="block truncate text-xs text-mist-700">{r.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Field label="Nama lengkap" required {...form.field('name')}>
          <Input autoComplete="name" placeholder="Nama Anda" {...form.bind('name')} />
        </Field>
        <Field label="Email / No. HP" optional {...form.field('contact')} hint="Agar kami bisa membalas.">
          <Input autoComplete="email" placeholder="nama@email.com" maxLength={160} {...form.bind('contact')} />
        </Field>
      </div>

      {/* Status */}
      <fieldset className="mt-5">
        <legend className="text-sm font-medium">
          Status saat ini <span className="text-danger">*</span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-invalid={occErr ? true : undefined}>
          {OCCUPATIONS.map((o) => {
            const on = form.values.occupation === o.value;
            const Icon = o.icon;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={on}
                name="occupation"
                onClick={() => form.setValue('occupation', o.value)}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 ring-inset transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
                  on ? 'bg-obsidian text-white ring-obsidian' : 'bg-white text-obsidian-600 ring-mist-100 hover:bg-mist-50 hover:text-obsidian',
                )}
              >
                <Icon className="h-4 w-4" />
                {o.label}
              </button>
            );
          })}
        </div>
        <p className={cn('mt-1.5 min-h-[20px] text-[13px]', occErr ? 'text-danger-700' : 'text-transparent')}>{occErr || '.'}</p>
      </fieldset>

      <div className="mt-1">
        <Field label="Pesan" required {...form.field('body')} hint={`${len}/${MAX} karakter`}>
          <Textarea rows={5} maxLength={MAX} placeholder="Tulis pertanyaan, kendala, atau saran Anda…" {...form.bind('body')} />
        </Field>
      </div>

      {/* honeypot anti-bot: tersembunyi dari pengguna */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" value={form.values.website} onChange={(e) => form.setValue('website', e.target.value)} />

      <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs text-mist-700">Pesan hanya dibaca oleh tim {brand.name}.</p>
        <Button type="submit" shape="pill" size="lg" loading={form.submitting} iconRight={<ArrowRight />}>
          {form.submitting ? 'Mengirim…' : 'Kirim pesan'}
        </Button>
      </div>
    </form>
  );
}

const ASIDE_ICONS = [Headset, Code2];

/** Kolom info di sisi kiri section kontak (site.kontak.aside). */
export function ContactAside() {
  const { kontak } = useSite();
  const items = kontak.aside || [];
  if (!items.length) return null;
  return (
    <Reveal delay={250} className="mt-8 space-y-3">
      {items.map(({ title: t, text: d }, i) => {
        const Icon = ASIDE_ICONS[i] || Headset;
        return (
          <div key={`${i}-${t}`} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-inset ring-mist-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ghost text-obsidian">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{t}</span>
              <span className="block text-sm text-mist-700">{d}</span>
            </span>
          </div>
        );
      })}
    </Reveal>
  );
}

export default ContactForm;
