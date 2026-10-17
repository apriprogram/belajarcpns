'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { rules, useForm } from '@/lib/useForm';
import { AuthHeading, AuthSwitch, FormAlert } from '@/components/auth/AuthParts';
import { Button, Field, Input } from '@/components/ui';

export default function LupaPasswordPage() {
  const [sent, setSent] = useState(null);
  const form = useForm({ initial: { email: '' }, validate: (v) => ({ email: rules.email(v.email) }) });

  const onSubmit = form.handleSubmit(async (v) => {
    const res = await api.post('/auth/forgot-password', { email: v.email.trim() });
    setSent({ email: v.email.trim(), message: res?.message, devToken: res?.dev_token });
  });

  if (sent) {
    return (
      <div>
        <AuthHeading
          icon={<MailCheck className="h-5 w-5" />}
          title="Cek email Anda"
          description={
            sent.message || (
              <>
                Jika <span className="font-medium text-obsidian">{sent.email}</span> terdaftar, tautan reset sudah kami kirim.
              </>
            )
          }
        />
        {sent.devToken && (
          <FormAlert tone="info" title="Mode development" className="mb-6">
            Email tidak dikirim di development. Pakai tautan ini:{' '}
            <Link href={`/reset-password?token=${encodeURIComponent(sent.devToken)}`} className="break-all font-semibold underline underline-offset-4">
              Atur ulang kata sandi
            </Link>
          </FormAlert>
        )}
        <div className="space-y-2">
          <Button href="/login" size="md" fullWidth>
            Kembali ke masuk
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={() => setSent(null)}>
            Kirim ulang
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthHeading title="Lupa kata sandi?" description="Masukkan email akun Anda. Kami kirim tautan untuk membuat kata sandi baru." />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {form.formError && <FormAlert>{form.formError}</FormAlert>}
        <Field label="Email" required {...form.field('email')}>
          <Input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="send" placeholder="nama@email.com" leftIcon={<Mail />} {...form.bind('email')} />
        </Field>
        <div className="pt-2">
          <Button type="submit" size="md" fullWidth loading={form.submitting}>
            Kirim tautan reset
          </Button>
        </div>
      </form>
      <AuthSwitch text="Ingat kata sandi?" href="/login">
        Masuk
      </AuthSwitch>
    </>
  );
}
