'use client';

import { Cake, CalendarDays, KeyRound, LogOut, Mail, MapPin, Phone, Save, ShieldCheck, User, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { formatAngka, formatRelatif, formatTanggal } from '@/lib/format';
import { passwordStrength, rules, useForm } from '@/lib/useForm';
import { useAuth } from '@/components/providers/AuthProvider';
import { FormAlert } from '@/components/auth/AuthParts';
import { Avatar, Badge, Button, DatePicker, Field, Input, PasswordInput, SegmentedProgress, Skeleton, Textarea, toISODate, useToast } from '@/components/ui';
import { formatTTL, formatUmur, todayYMD } from '@/components/profile/profile-utils';
import { useResource } from '@/components/peserta/hooks';
import { GenderPicker, genderLabel } from '@/components/profile/GenderPicker';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { PageHead, Panel, PanelHeader, PanelSkeleton } from '../_components/kit';

const STRENGTH = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'];
const CRUMBS = [{ href: '/dashboard', label: 'Dashboard' }, { label: 'Profil' }];
const ADMIN_CRUMBS = [{ href: '/admin', label: 'Admin' }, { label: 'Profil' }];

/** Halaman profil. admin=true → dipakai di panel admin (tanpa ringkasan statistik peserta). */
export function ProfilView({ admin = false }) {
  const { user, loading, logout } = useAuth();
  const crumbs = admin ? ADMIN_CRUMBS : CRUMBS;
  const dash = useResource(() => (admin ? Promise.resolve(null) : api.get('/me/dashboard')), [admin]);

  if (loading || !user) {
    return (
      <>
        <PageHead crumbs={crumbs} mascot="/maskot/profil.webp" title="Profil" description="Kelola data diri dan keamanan akun Anda." />
        <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
          <PanelSkeleton className="lg:col-span-4" height="h-72" />
          <PanelSkeleton className="lg:col-span-8" height="h-72" />
        </div>
      </>
    );
  }

  const s = dash.data?.stats;
  const stats = [
    ['Ujian selesai', s ? formatAngka(s.attempts_done) : null],
    ['Rata-rata skor', s ? formatAngka(s.avg_score, { maxDecimals: 1 }) : null],
    ['Skor terbaik', s ? formatAngka(s.best_score) : null],
    ['Tingkat lulus', s ? `${formatAngka(s.pass_rate)}%` : null],
    ['Soal latihan', s ? formatAngka(s.practice_answered) : null],
    ['Akurasi latihan', s ? `${formatAngka(s.practice_accuracy)}%` : null],
  ];

  return (
    <>
      <PageHead crumbs={crumbs} mascot="/maskot/profil.webp" title="Profil" description="Kelola data diri dan keamanan akun Anda." />
      <div className="grid items-start gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        <div className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
          <Panel>
            <div className="flex items-start justify-between gap-3">
              <Avatar name={user.name} src={user.avatar_url} size="xl" className="[&>img]:!ring-0 [&>span]:!h-16 [&>span]:!w-16 [&>span]:!text-xl [&>span]:!ring-0" />
              <Badge status={user.status === 'blocked' ? 'diblokir' : 'aktif'} size="sm" />
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-[-0.01em]">{user.name}</h2>
            <p className="mt-0.5 break-all text-sm text-mist-700">{user.email}</p>
            <ul className="mt-5 divide-y divide-mist-100 border-t border-mist-100 text-sm">
              <InfoRow icon={<Phone />} label="Nomor HP" value={user.phone || '—'} mono />
              <InfoRow icon={<Users />} label="Jenis kelamin" value={genderLabel(user.gender)} />
              <InfoRow icon={<CalendarDays />} label="Tempat, tgl lahir" value={formatTTL(user.birth_place, user.birth_date)} />
              <InfoRow icon={<Cake />} label="Umur" value={formatUmur(user.birth_date)} />
              <InfoRow icon={<MapPin />} label="Alamat" value={user.address || '—'} wrap />
              <InfoRow icon={<CalendarDays />} label="Bergabung" value={formatTanggal(user.created_at, 'long')} />
              <InfoRow icon={<ShieldCheck />} label="Terakhir aktif" value={user.last_seen_at ? formatRelatif(user.last_seen_at) : '—'} />
            </ul>
            <Button variant="danger-soft" size="sm" fullWidth icon={<LogOut />} className="mt-5" onClick={logout}>
              Keluar dari akun
            </Button>
          </Panel>

          {!admin && <Panel>
            <PanelHeader title="Ringkasan statistik" info="Diambil dari aktivitas tryout dan latihan Anda." />
            <div className="grid grid-cols-2 gap-2">
              {stats.map(([l, v]) => (
                <div key={l} className="rounded-xl bg-ghost p-3.5">
                  <p className="text-xs text-mist-700">{l}</p>
                  {v == null ? <Skeleton className="mt-2 h-6 w-14" /> : <p className="mt-1 text-xl font-semibold tabular-nums">{v}</p>}
                </div>
              ))}
            </div>
          </Panel>}
        </div>

        <Panel padding="none" className="lg:col-span-8">
          <div className="px-5 pb-5 pt-6 sm:px-10 sm:pb-6 sm:pt-9">
            <h2 className="text-[20px] font-semibold leading-tight tracking-[-0.01em] sm:text-[28px] sm:tracking-[-0.02em]">Edit profil</h2>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-mist-700 sm:text-[15px]">Perbarui data diri yang tampil di hasil dan peringkat tryout, serta jaga keamanan akun Anda.</p>
          </div>
          <div className="mx-5 border-t border-mist-100 sm:mx-10" />
          <AvatarUploader user={user} />
          <div className="mx-5 border-t border-mist-100 sm:mx-10" />
          <ProfileForm user={user} />
          <div className="mx-5 border-t border-mist-100 sm:mx-10" />
          <PasswordForm />
        </Panel>
      </div>
    </>
  );
}

function InfoRow({ icon, label, value, mono, wrap }) {
  return (
    <li className={cn('flex gap-3 py-3', wrap ? 'items-start' : 'items-center')}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ghost text-obsidian-600 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span className={cn('shrink-0 text-mist-700', wrap && 'pt-1.5')}>{label}</span>
      <span className={cn('ml-auto min-w-0 text-right font-medium', wrap ? 'whitespace-pre-line break-words pt-1.5' : 'truncate', mono && 'font-mono tabular-nums')}>{value}</span>
    </li>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-start gap-3 sm:mb-6">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-mist-100 text-obsidian-600" aria-hidden>
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </span>
      <div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] sm:text-xl sm:tracking-[-0.02em]">{title}</h3>
        <p className="mt-1 text-sm text-mist-700">{subtitle}</p>
      </div>
    </div>
  );
}

function ProfileForm({ user }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const form = useForm({
    initial: { name: user.name || '', phone: user.phone || '', gender: user.gender || '', birth_place: user.birth_place || '', birth_date: user.birth_date || '', address: user.address || '' },
    validate: (v) => ({
      name: rules.required(v.name, 'Nama') || (v.name.trim().length < 3 ? 'Nama minimal 3 karakter' : null),
      phone: rules.phone(v.phone),
      gender: !v.gender ? 'Pilih jenis kelamin' : null,
      birth_place: v.birth_place.trim().length > 100 ? 'Tempat lahir maksimal 100 karakter' : null,
      birth_date: v.birth_date && v.birth_date > todayYMD() ? 'Tanggal lahir tidak boleh di masa depan' : null,
      address: v.address.trim().length > 300 ? 'Alamat maksimal 300 karakter' : null,
    }),
  });
  const initialValues = { name: user.name || '', phone: user.phone || '', gender: user.gender || '', birth_place: user.birth_place || '', birth_date: user.birth_date || '', address: user.address || '' };
  const dirty = Object.keys(initialValues).some((k) => String(form.values[k] ?? '').trim() !== initialValues[k]);
  const onSubmit = form.handleSubmit(async (v) => {
    const me = await api.put('/me', {
      name: v.name.trim(),
      phone: v.phone.replace(/[\s-]/g, ''),
      gender: v.gender,
      birth_place: v.birth_place.trim(),
      birth_date: v.birth_date || '',
      address: v.address.trim(),
    });
    setUser(me);
    form.reset({ name: me.name, phone: me.phone, gender: me.gender || '', birth_place: me.birth_place || '', birth_date: me.birth_date || '', address: me.address || '' });
    toast.success('Profil diperbarui', 'Perubahan data diri sudah disimpan.');
  });
  return (
    <section aria-labelledby="judul-data-diri" className="px-5 py-6 sm:px-10 sm:py-8">
      <SectionTitle icon={User} title={<span id="judul-data-diri">Informasi dasar</span>} subtitle="Nama tampil di hasil dan peringkat tryout." />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {form.formError && <FormAlert>{form.formError}</FormAlert>}
        <Field label="Nama lengkap" required {...form.field('name', { success: true })}>
          <Input size="lg" autoComplete="name" leftIcon={<User />} {...form.bind('name')} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Nomor HP" required {...form.field('phone', { success: true })}>
            <Input size="lg" type="tel" inputMode="tel" autoComplete="tel" leftIcon={<Phone />} mono {...form.bind('phone')} />
          </Field>
          <Field label="Email" hint="Email tidak dapat diubah. Hubungi admin bila perlu mengganti email.">
            <Input size="lg" value={user.email} disabled leftIcon={<Mail />} readOnly />
          </Field>
        </div>
        <Field label="Jenis kelamin" required {...form.field('gender')}>
          <GenderPicker size="lg" value={form.values.gender} onChange={(g) => form.setValue('gender', g)} invalid={!!form.errorOf('gender')} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Tempat lahir" optional {...form.field('birth_place')}>
            <Input size="lg" placeholder="Mis. Bandung" maxLength={100} leftIcon={<MapPin />} {...form.bind('birth_place')} />
          </Field>
          <Field
            label="Tanggal lahir"
            optional
            {...form.field('birth_date')}
            hint={form.values.birth_date ? `Umur ${formatUmur(form.values.birth_date)}` : 'Umur dihitung otomatis.'}
          >
            <DatePicker
              size="lg"
              label="Tanggal lahir"
              placeholder="Pilih tanggal lahir"
              icon={<Cake />}
              name="birth_date"
              min="1940-01-01"
              max={todayYMD()}
              defaultView="year"
              showToday={false}
              value={form.values.birth_date}
              onChange={(d) => form.setValue('birth_date', toISODate(d))}
            />
          </Field>
        </div>
        <Field label="Alamat" optional {...form.field('address')} hint={`${form.values.address.length}/300`}>
          <Textarea rows={3} maxLength={300} placeholder="Jalan, RT/RW, kelurahan, kecamatan, kota/kabupaten, provinsi" {...form.bind('address')} />
        </Field>
        <div className="flex justify-end gap-2 pt-2 max-sm:[&>*]:flex-1">
          <Button variant="secondary" disabled={!dirty || form.submitting} onClick={() => form.reset(initialValues)}>
            Batal
          </Button>
          <Button type="submit" icon={<Save />} loading={form.submitting} disabled={!dirty}>
            Simpan perubahan
          </Button>
        </div>
      </form>
    </section>
  );
}

function PasswordForm() {
  const toast = useToast();
  const initial = { current_password: '', password: '', password_confirm: '' };
  const form = useForm({
    initial,
    validate: (v) => ({
      current_password: !v.current_password ? 'Kata sandi saat ini wajib diisi' : null,
      password: rules.password(v.password) || (v.password && v.password === v.current_password ? 'Gunakan kata sandi yang berbeda dari sebelumnya' : null),
      password_confirm: rules.match(v.password_confirm, v.password),
    }),
  });
  const strength = passwordStrength(form.values.password);
  const onSubmit = form.handleSubmit(async (v) => {
    await api.put('/me/password', v);
    form.reset(initial);
    toast.success('Kata sandi diperbarui', 'Gunakan kata sandi baru saat masuk berikutnya.');
  });
  return (
    <section aria-labelledby="judul-sandi" className="px-5 py-6 sm:px-10 sm:py-8">
      <SectionTitle icon={KeyRound} title={<span id="judul-sandi">Ubah kata sandi</span>} subtitle="Minimal 8 karakter, kombinasi huruf dan angka." />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {form.formError && <FormAlert>{form.formError}</FormAlert>}
        <Field label="Kata sandi saat ini" required {...form.field('current_password')}>
          <PasswordInput size="lg" autoComplete="current-password" {...form.bind('current_password')} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Field label="Kata sandi baru" required {...form.field('password')}>
              <PasswordInput size="lg" autoComplete="new-password" {...form.bind('password')} />
            </Field>
            {form.values.password && (
              <div className="mt-3">
                <SegmentedProgress total={4} value={strength} color={strength >= 3 ? 'mint-dark' : strength === 2 ? 'warning' : 'danger'} showCount={false} />
                <p className="mt-1.5 text-xs text-mist-700">
                  Kekuatan: <span className="font-semibold text-obsidian">{STRENGTH[strength]}</span>
                </p>
              </div>
            )}
          </div>
          <Field label="Ulangi kata sandi baru" required {...form.field('password_confirm', { success: 'Kata sandi cocok' })}>
            <PasswordInput size="lg" autoComplete="new-password" {...form.bind('password_confirm')} />
          </Field>
        </div>
        <div className="flex justify-end pt-2 max-sm:[&>*]:flex-1">
          <Button type="submit" icon={<KeyRound />} loading={form.submitting}>
            Perbarui kata sandi
          </Button>
        </div>
      </form>
    </section>
  );
}

export default ProfilView;
