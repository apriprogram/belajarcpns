'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, LinkIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { passwordStrength, rules, useForm } from '@/lib/useForm';
import { AuthHeading, AuthSwitch, FormAlert } from '@/components/auth/AuthParts';
import { Button, Field, PasswordInput, SegmentedProgress } from '@/components/ui';

const STRENGTH = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'];
const STRENGTH_COLOR = ['mist', 'danger', 'warning', 'cobalt', 'mint-dark'];

export function ResetForm() {
  const token = useSearchParams().get('token') || '';
  const [done, setDone] = useState(false);
  const form = useForm({
    initial: { password: '', password_confirm: '' },
    validate: (v) => ({ password: rules.password(v.password), password_confirm: rules.match(v.password_confirm, v.password) }),
  });

  const onSubmit = form.handleSubmit(async (v) => {
    await api.post('/auth/reset-password', { token, password: v.password, password_confirm: v.password_confirm });
    setDone(true);
  });

  if (!token) {
    return (
      <div>
        <AuthHeading icon={<LinkIcon className="h-5 w-5" />} title="Tautan tidak valid" description="Tautan tidak lengkap atau sudah kedaluwarsa. Minta tautan baru." />
        <Button href="/lupa-password" size="md" fullWidth>
          Minta tautan baru
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <AuthHeading icon={<CheckCircle2 className="h-5 w-5 text-mint-700" />} title="Kata sandi diperbarui" description="Silakan masuk dengan kata sandi baru." />
        <Button href="/login" size="md" fullWidth>
          Masuk sekarang
        </Button>
      </div>
    );
  }

  const strength = passwordStrength(form.values.password);
  const tokenError = form.errors.token;

  return (
    <>
      <AuthHeading title="Buat kata sandi baru" description="Pakai kata sandi yang belum pernah dipakai." />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {(form.formError || tokenError) && (
          <FormAlert>
            {tokenError || form.formError}{' '}
            <Link href="/lupa-password" className="font-semibold underline underline-offset-4">
              Minta tautan baru
            </Link>
          </FormAlert>
        )}
        <div>
          <Field label="Kata sandi baru" required hint="Minimal 8 karakter, huruf dan angka." {...form.field('password')}>
            <PasswordInput autoComplete="new-password" placeholder="Kata sandi baru" {...form.bind('password')} />
          </Field>
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
        <div className="pt-2">
          <Button type="submit" size="md" fullWidth loading={form.submitting}>
            Simpan kata sandi
          </Button>
        </div>
      </form>
      <AuthSwitch text="Ingat kata sandi?" href="/login">
        Masuk
      </AuthSwitch>
    </>
  );
}
