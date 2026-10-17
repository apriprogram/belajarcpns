'use client';

import { useBrandName } from '@/components/layout/Logo';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Phone, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { passwordStrength, rules, useForm } from '@/lib/useForm';
import { useAuth } from '@/components/providers/AuthProvider';
import { AuthHeading, AuthSwitch, FormAlert } from '@/components/auth/AuthParts';
import { Button, Checkbox, Field, Input, PasswordInput, SegmentedProgress, useToast } from '@/components/ui';
import { GenderPicker } from '@/components/profile/GenderPicker';
import { resolveNext } from '../login/LoginForm';

const STRENGTH = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'];
const STRENGTH_COLOR = ['mist', 'danger', 'warning', 'cobalt', 'mint-dark'];

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const toast = useToast();
  const brand = useBrandName();
  const { user, loading, setUser } = useAuth();

  const form = useForm({
    initial: { name: '', email: '', phone: '', gender: '', password: '', password_confirm: '', agree: false },
    validate: (v) => ({
      name: !v.name.trim() ? 'Nama lengkap wajib diisi' : v.name.trim().length < 3 ? 'Nama minimal 3 karakter' : null,
      email: rules.email(v.email),
      phone: rules.phone(v.phone),
      gender: !v.gender ? 'Pilih jenis kelamin' : null,
      password: rules.password(v.password),
      password_confirm: rules.match(v.password_confirm, v.password),
      agree: !v.agree ? 'Anda perlu menyetujui ketentuan penggunaan' : null,
    }),
  });

  useEffect(() => {
    if (!loading && user) router.replace(resolveNext(next, user));
  }, [loading, user, next, router]);

  const onSubmit = form.handleSubmit(async (v) => {
    const me = await api.post('/auth/register', {
      name: v.name.trim(),
      email: v.email.trim(),
      phone: v.phone.replace(/[\s-]/g, ''),
      gender: v.gender,
      password: v.password,
      password_confirm: v.password_confirm,
    });
    toast.success('Akun berhasil dibuat', `Selamat datang di ${brand}!`);
    if (me && me.id) setUser(me);
    router.replace(resolveNext(next, me || { role: 'peserta' }));
  });

  const strength = passwordStrength(form.values.password);

  // Setiap field selalu punya satu baris pesan (hint ↔ error) dan sukses hanya berupa ikon,
  // sehingga validasi saat blur tidak menggeser layout (mis. checkbox ketentuan) di tengah klik.
  return (
    <>
      <AuthHeading title="Buat akun gratis" description="Daftar untuk mulai latihan SKD." />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {form.formError && <FormAlert>{form.formError}</FormAlert>}
        <Field label="Nama lengkap" required hint="Sesuai KTP." {...form.field('name', { success: true })}>
          <Input autoComplete="name" autoCapitalize="words" enterKeyHint="next" placeholder="Nama lengkap" leftIcon={<UserRound />} {...form.bind('name')} />
        </Field>
        <Field label="Email" required hint="Dipakai untuk masuk." {...form.field('email', { success: true })}>
          <Input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" placeholder="nama@email.com" leftIcon={<Mail />} {...form.bind('email')} />
        </Field>
        <Field label="Nomor HP" required hint="Contoh: 081234567890." {...form.field('phone', { success: true })}>
          <Input type="tel" autoComplete="tel" inputMode="tel" enterKeyHint="next" placeholder="08xxxxxxxxxx" leftIcon={<Phone />} {...form.bind('phone')} />
        </Field>
        <Field label="Jenis kelamin" required hint="Pilih salah satu." {...form.field('gender')}>
          <GenderPicker value={form.values.gender} onChange={(g) => form.setValue('gender', g)} invalid={!!form.errorOf('gender')} />
        </Field>
        <div>
          <Field label="Kata sandi" required hint="Minimal 8 karakter, huruf dan angka." {...form.field('password')}>
            <PasswordInput autoComplete="new-password" placeholder="Buat kata sandi" {...form.bind('password')} />
          </Field>
          {/* Tinggi tetap: meter muncul tanpa menggeser field di bawahnya */}
          <div className="mt-2 flex h-4 items-center gap-3" aria-live="polite">
            {form.values.password && (
              <>
                <SegmentedProgress total={4} value={strength} color={STRENGTH_COLOR[strength]} showCount={false} className="flex-1" />
                <span className="w-20 text-right text-xs font-medium text-mist-700">{STRENGTH[strength]}</span>
              </>
            )}
          </div>
        </div>
        <Field label="Konfirmasi kata sandi" required hint="Ketik ulang kata sandi." {...form.field('password_confirm', { success: true })}>
          <PasswordInput autoComplete="new-password" placeholder="Ulangi kata sandi" {...form.bind('password_confirm')} />
        </Field>
        <div className="pt-1">
          <Checkbox
            label="Saya menyetujui ketentuan penggunaan"
            description={`${brand} platform latihan mandiri, bukan bagian dari BKN.`}
            {...form.bind('agree', { type: 'checkbox' })}
          />
          {form.errorOf('agree') && (
            <p role="alert" className="ml-8 mt-1.5 text-[13px] text-danger-700">
              {form.errorOf('agree')}
            </p>
          )}
        </div>
        <div className="pt-2">
          <Button type="submit" size="md" fullWidth loading={form.submitting}>
            {form.submitting ? 'Membuat akun…' : 'Daftar'}
          </Button>
        </div>
      </form>
      <AuthSwitch text="Sudah punya akun?" href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>
        Masuk
      </AuthSwitch>
    </>
  );
}
