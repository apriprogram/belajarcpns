'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { rules, useForm } from '@/lib/useForm';
import { homeFor, useAuth } from '@/components/providers/AuthProvider';
import { AuthHeading, AuthSwitch, FormAlert } from '@/components/auth/AuthParts';
import { Button, Field, Input, PasswordInput } from '@/components/ui';

/** Tujuan setelah login: hormati ?next= (hanya path internal) sesuai role. */
export function resolveNext(next, user) {
  const safe = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  if (!safe || safe.startsWith('/login') || safe.startsWith('/daftar')) return homeFor(user);
  if (safe.startsWith('/admin') && user?.role !== 'admin') return '/dashboard';
  return safe;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const { user, loading, setUser } = useAuth();

  const form = useForm({
    initial: { email: '', password: '' },
    validate: (v) => ({
      email: rules.email(v.email),
      password: !v.password ? 'Kata sandi wajib diisi' : null,
    }),
  });

  // Sudah login → langsung arahkan.
  useEffect(() => {
    if (!loading && user) router.replace(resolveNext(next, user));
  }, [loading, user, next, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const me = await api.post('/auth/login', { email: values.email.trim(), password: values.password });
      setUser(me);
      router.replace(resolveNext(next, me));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && !err.fields) {
        form.setFormError('Email atau kata sandi salah. Periksa kembali lalu coba lagi.');
        return;
      }
      if (err instanceof ApiError && err.code === 'TOO_MANY_REQUESTS') {
        form.setFormError('Terlalu banyak percobaan masuk. Tunggu sebentar lalu coba lagi.');
        return;
      }
      throw err;
    }
  });

  return (
    <>
      <AuthHeading title="Selamat datang kembali" description="Masuk untuk lanjut latihan." />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {form.formError && <FormAlert>{form.formError}</FormAlert>}
        <Field label="Email" required {...form.field('email')}>
          <Input type="email" autoComplete="username" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" placeholder="nama@email.com" leftIcon={<Mail />} {...form.bind('email')} />
        </Field>
        <Field
          label="Kata sandi"
          required
          {...form.field('password')}
          labelAction={
            <Link href="/lupa-password" className="-my-2 inline-flex min-h-9 items-center rounded px-1 text-[13px] font-medium text-cobalt hover:text-cobalt-700 sm:my-0 sm:inline sm:min-h-0 sm:px-0">
              Lupa kata sandi?
            </Link>
          }
        >
          <PasswordInput autoComplete="current-password" enterKeyHint="go" placeholder="Kata sandi Anda" {...form.bind('password')} />
        </Field>
        <div className="pt-2">
          <Button type="submit" size="md" fullWidth loading={form.submitting}>
            {form.submitting ? 'Memproses…' : 'Masuk'}
          </Button>
        </div>
      </form>
      <AuthSwitch text="Belum punya akun?" href={next ? `/daftar?next=${encodeURIComponent(next)}` : '/daftar'}>
        Daftar
      </AuthSwitch>
      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 rounded-xl bg-ghost px-4 py-3 text-xs leading-relaxed text-mist-700">
          <p className="font-semibold text-obsidian-600">Akun demo (development)</p>
          <p className="mt-1 font-mono">admin@bisapns.id · Admin123!</p>
          <p className="font-mono">peserta1@bisapns.id · Peserta123!</p>
        </div>
      )}
    </>
  );
}
