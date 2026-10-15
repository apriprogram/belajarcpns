'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock3, FileStack, Info, KeyRound, LibraryBig, LogIn, Megaphone, MessagesSquare, PlayCircle, RotateCcw, Save, Settings2, ShieldBan, ShieldCheck, Target } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatRelatif, formatTanggalJam } from '@/lib/format';
import { Button, EmptyState, ErrorState, Field, Input, Pagination, Skeleton, useToast } from '@/components/ui';
import { AdminPageHeader, Panel, PanelFooter, PanelHeader } from '@/components/admin/AdminUI';
import { FormAlert } from '@/components/auth/AuthParts';
import { SubtestChip } from '@/components/admin/AdminParts';
import { SKD_TARGET, SUBTEST_MAX, useResource } from '@/components/admin/shared';

const ACTIONS = {
  login: { label: 'Masuk ke aplikasi', icon: LogIn, tone: 'mist' },
  'soal.tambah': { label: 'Menambah soal', icon: LibraryBig, tone: 'cobalt' },
  'soal.ubah': { label: 'Mengubah soal', icon: LibraryBig, tone: 'cobalt' },
  'soal.hapus': { label: 'Menghapus soal', icon: LibraryBig, tone: 'danger' },
  'soal.import': { label: 'Import soal CSV', icon: LibraryBig, tone: 'cobalt' },
  'paket.tambah': { label: 'Membuat paket', icon: FileStack, tone: 'cobalt' },
  'paket.ubah': { label: 'Mengubah paket', icon: FileStack, tone: 'cobalt' },
  'paket.hapus': { label: 'Menghapus paket', icon: FileStack, tone: 'danger' },
  'paket.soal': { label: 'Menyusun soal paket', icon: FileStack, tone: 'cobalt' },
  'paket.auto_fill': { label: 'Isi otomatis paket', icon: FileStack, tone: 'cobalt' },
  'paket.status': { label: 'Mengubah status paket', icon: FileStack, tone: 'warning' },
  'peserta.blokir': { label: 'Memblokir peserta', icon: ShieldBan, tone: 'danger' },
  'peserta.aktifkan': { label: 'Mengaktifkan peserta', icon: ShieldCheck, tone: 'mint' },
  'peserta.reset_password': { label: 'Reset password peserta', icon: KeyRound, tone: 'warning' },
  'pengumuman.tambah': { label: 'Membuat pengumuman', icon: Megaphone, tone: 'cobalt' },
  'pengumuman.ubah': { label: 'Mengubah pengumuman', icon: Megaphone, tone: 'cobalt' },
  'pengumuman.hapus': { label: 'Menghapus pengumuman', icon: Megaphone, tone: 'danger' },
  'pengaturan.ubah': { label: 'Mengubah pengaturan', icon: Settings2, tone: 'warning' },
  'ujian.mulai': { label: 'Memulai ujian', icon: PlayCircle, tone: 'cobalt' },
  'ujian.selesai': { label: 'Menyelesaikan ujian', icon: Target, tone: 'mint' },
  'groupchat.pengaturan': { label: 'Mengubah pengaturan GroupChat', icon: MessagesSquare, tone: 'warning' },
  'groupchat.reset': { label: 'Mereset GroupChat', icon: MessagesSquare, tone: 'danger' },
};
const TONE = {
  mist: 'text-obsidian-600',
  cobalt: 'text-cobalt',
  danger: 'text-danger',
  warning: 'text-warning-700',
  mint: 'text-mint-700',
};

const DEFAULTS = { twk: '65', tiu: '80', tkp: '166', total: '0', duration: '100', c_twk: '30', c_tiu: '35', c_tkp: '45' };

function toForm(s) {
  return {
    twk: String(s.passing_grade?.twk ?? 0),
    tiu: String(s.passing_grade?.tiu ?? 0),
    tkp: String(s.passing_grade?.tkp ?? 0),
    total: String(s.passing_grade?.total ?? 0),
    duration: String(s.default_duration ?? 100),
    c_twk: String(s.composition?.twk ?? 0),
    c_tiu: String(s.composition?.tiu ?? 0),
    c_tkp: String(s.composition?.tkp ?? 0),
  };
}

export function SettingsView() {
  const toast = useToast();
  const settings = useResource(() => api.get('/admin/settings'), []);
  const [page, setPage] = useState(1);
  const log = useResource(() => api.list('/admin/activity', { query: { page, per_page: 12 } }), [page]);
  const [v, setV] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.data) setV(toForm(settings.data));
  }, [settings.data]);

  const dirty = v && settings.data && JSON.stringify(v) !== JSON.stringify(toForm(settings.data));
  const set = (k) => (e) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: undefined }));
  };
  const compTotal = v ? (Number(v.c_twk) || 0) + (Number(v.c_tiu) || 0) + (Number(v.c_tkp) || 0) : 0;

  const save = async (e) => {
    e.preventDefault();
    const err = {};
    const checkInt = (k, min, max) => {
      const n = Number(v[k]);
      if (v[k] === '' || !Number.isInteger(n) || n < min || n > max) err[k] = `Bilangan bulat ${min}–${max}`;
    };
    checkInt('twk', 0, SUBTEST_MAX.TWK);
    checkInt('tiu', 0, SUBTEST_MAX.TIU);
    checkInt('tkp', 0, SUBTEST_MAX.TKP);
    checkInt('total', 0, 550);
    checkInt('duration', 1, 600);
    checkInt('c_twk', 0, 200);
    checkInt('c_tiu', 0, 200);
    checkInt('c_tkp', 0, 200);
    if (!err.c_twk && compTotal === 0) err.c_twk = 'Komposisi tidak boleh kosong semua';
    setErrors(err);
    setFormError(null);
    if (Object.keys(err).length) return;
    setSaving(true);
    try {
      const r = await api.put('/admin/settings', {
        passing_grade: { twk: Number(v.twk), tiu: Number(v.tiu), tkp: Number(v.tkp), total: Number(v.total) },
        default_duration: Number(v.duration),
        composition: { twk: Number(v.c_twk), tiu: Number(v.c_tiu), tkp: Number(v.c_tkp) },
      });
      settings.setData(r && r.passing_grade ? r : { passing_grade: { twk: +v.twk, tiu: +v.tiu, tkp: +v.tkp, total: +v.total }, default_duration: +v.duration, composition: { twk: +v.c_twk, tiu: +v.c_tiu, tkp: +v.c_tkp } });
      toast.success('Pengaturan disimpan', 'Berlaku untuk paket baru dan isi otomatis berikutnya.');
      log.reload({ silent: true });
    } catch (e2) {
      if (e2 instanceof ApiError && e2.fields) {
        const map = {};
        Object.entries(e2.fields).forEach(([k, msg]) => (map[k.replace('passing_grade.', '').replace('composition.', 'c_').replace('default_duration', 'duration')] = msg));
        setErrors(map);
      }
      setFormError(errorMessage(e2));
      toast.error('Gagal menyimpan pengaturan', errorMessage(e2));
    } finally {
      setSaving(false);
    }
  };

  const numInput = (k, label, extra = {}) => (
    <Field label={label} error={errors[k]} {...extra}>
      <Input type="number" inputMode="numeric" min={0} value={v[k]} onChange={set(k)} mono />
    </Field>
  );

  return (
    <div>
      <AdminPageHeader title="Pengaturan" description="Nilai bawaan untuk paket ujian baru, penilaian SKD, dan jejak aktivitas admin." />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 min-w-0 lg:col-span-7">
          <FormAlert tone="info" title="Periksa ketentuan resmi BKN 2027">
            Nilai ambang batas (passing grade), jumlah soal, dan durasi SKD CPNS 2027 mengikuti keputusan resmi BKN/KemenPAN-RB yang dapat berubah. Nilai bawaan di bawah (65/80/166, 110 soal, 100 menit) mengacu pada ketentuan
            periode sebelumnya — sesuaikan setelah pengumuman resmi terbit.
          </FormAlert>

          {settings.error ? (
            <Panel padding="none">
              <ErrorState error={settings.error} onRetry={() => settings.reload()} />
            </Panel>
          ) : !v ? (
            <Skeleton className="h-80" rounded="rounded-[20px]" />
          ) : (
            <form onSubmit={save} noValidate>
              <Panel padding="lg">
                <PanelHeader icon={<Target />} title="Passing grade default" subtitle="Dipakai saat membuat paket baru. Paket lama tidak berubah." />
                {formError && <FormAlert className="mb-5">{formError}</FormAlert>}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    ['twk', 'TWK', SUBTEST_MAX.TWK],
                    ['tiu', 'TIU', SUBTEST_MAX.TIU],
                    ['tkp', 'TKP', SUBTEST_MAX.TKP],
                    ['total', 'Total', 550],
                  ].map(([k, l, max]) => (
                    <div key={k}>{numInput(k, <span className="flex items-center gap-1.5">{k === 'total' ? <span className="inline-flex h-7 items-center">Total</span> : <SubtestChip code={l} />}<span className="text-xs font-normal text-mist-500">/ {max}</span></span>)}</div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-mist-700">Total 0 berarti kelulusan hanya ditentukan ambang per subtes.</p>

                <div className="my-6 h-px bg-mist-100" />

                <PanelHeader icon={<Clock3 />} title="Durasi & komposisi default" subtitle="Durasi paket baru dan jumlah soal untuk fitur Isi otomatis." />
                <div className="grid gap-4 sm:grid-cols-4">
                  {numInput('duration', <span className="inline-flex h-7 items-center">Durasi (menit)</span>)}
                  {numInput('c_twk', <span className="flex items-center gap-1.5"><SubtestChip code="TWK" /> soal</span>)}
                  {numInput('c_tiu', <span className="flex items-center gap-1.5"><SubtestChip code="TIU" /> soal</span>)}
                  {numInput('c_tkp', <span className="flex items-center gap-1.5"><SubtestChip code="TKP" /> soal</span>)}
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ghost px-4 py-3 text-sm">
                  <span className="text-mist-700">
                    Total komposisi <span className={cn('font-mono font-semibold', compTotal === 110 ? 'text-mint-700' : 'text-obsidian')}>{compTotal} soal</span>
                    {compTotal !== 110 && <span className="text-warning-700"> · standar SKD {SKD_TARGET.TWK + SKD_TARGET.TIU + SKD_TARGET.TKP}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => setV((s) => ({ ...s, ...DEFAULTS }))}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-cobalt hover:text-cobalt-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Kembalikan nilai standar
                  </button>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-mist-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-mist-700">{dirty ? 'Ada perubahan belum disimpan' : 'Semua pengaturan tersimpan'}</span>
                  <div className="flex gap-2">
                    {dirty && (
                      <Button variant="ghost" onClick={() => setV(toForm(settings.data))} disabled={saving}>
                        Batalkan
                      </Button>
                    )}
                    <Button type="submit" icon={<Save />} loading={saving} disabled={!dirty}>
                      Simpan pengaturan
                    </Button>
                  </div>
                </div>
              </Panel>
            </form>
          )}
        </div>

        <Panel className="h-fit overflow-hidden lg:col-span-5" padding="none">
          <div className="px-5 pt-5">
            <PanelHeader icon={<Activity />} title="Log aktivitas" subtitle="Jejak aksi admin dan peserta terbaru." className="mb-2" />
          </div>
          {log.error ? (
            <ErrorState size="sm" error={log.error} onRetry={() => log.reload()} />
          ) : (
            <>
              <ol className={cn('px-3', log.loading && log.data && 'opacity-60')}>
                {log.loading && !log.data ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-3 py-3">
                      <Skeleton className="h-9 w-9" rounded="rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-2/3" rounded="rounded-md" />
                        <Skeleton className="h-3 w-1/3" rounded="rounded-md" />
                      </div>
                    </li>
                  ))
                ) : !(log.data || []).length ? (
                  <li>
                    <EmptyState size="sm" icon={<Info />} title="Belum ada aktivitas" />
                  </li>
                ) : (
                  log.data.map((a) => {
                    const conf = ACTIONS[a.action] || { label: a.action, icon: Activity, tone: 'mist' };
                    const Icon = conf.icon;
                    return (
                      <li key={a.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5 hover:bg-mist-50">
                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-inset ring-mist-100', TONE[conf.tone])} aria-hidden>
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{a.user_name || 'Sistem'}</span> <span className="text-obsidian-600">{conf.label.charAt(0).toLowerCase() + conf.label.slice(1)}</span>
                          </p>
                          {a.detail && <p className="truncate font-mono text-[11px] text-mist-500" title={a.detail}>{a.detail}</p>}
                        </div>
                        <time dateTime={a.created_at} title={formatTanggalJam(a.created_at)} className="shrink-0 whitespace-nowrap text-xs text-mist-700">
                          {formatRelatif(a.created_at)}
                        </time>
                      </li>
                    );
                  })
                )}
              </ol>
              {log.meta && log.meta.total_pages > 1 && (
                <PanelFooter className="mt-2 [&_nav]:!flex-col [&_nav]:!items-center">
                  <Pagination meta={log.meta} onChange={setPage} />
                </PanelFooter>
              )}
              {log.meta && log.meta.total_pages <= 1 && <div className="h-4" />}
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default SettingsView;
