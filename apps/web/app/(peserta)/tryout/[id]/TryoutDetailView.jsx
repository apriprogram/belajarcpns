'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, CalendarClock, Clock3, CloudUpload, EyeOff, FileText, Keyboard, Lock, Play, RotateCw, Send, ServerCog, Shuffle, Timer } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api, errorMessage } from '@/lib/api';
import { formatAngka, formatTimer } from '@/lib/format';
import { Badge, Button, Checkbox, Chip, ErrorState, ProgressBar, Skeleton, SUBTEST_COLOR } from '@/components/ui';
import { FormAlert } from '@/components/auth/AuthParts';
import { useResource } from '@/components/peserta/hooks';
import { POINTS_PER_QUESTION, schedule, SUBTESTS } from '@/components/peserta/constants';
import { IconBox, PageHead, Panel, PanelHeader, PanelSkeleton } from '../../_components/kit';

const CRUMBS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tryout', label: 'Tryout' },
];

const RULES = [
  { icon: ServerCog, title: 'Timer dihitung server', desc: 'Waktu berjalan sejak Anda menekan Mulai dan tetap berjalan walau halaman ditutup atau koneksi terputus.' },
  { icon: CloudUpload, title: 'Jawaban tersimpan otomatis', desc: 'Setiap pilihan langsung disimpan. Jika halaman dimuat ulang, jawaban dan sisa waktu dipulihkan.' },
  { icon: Bookmark, title: 'Tandai ragu-ragu', desc: 'Gunakan tombol Ragu-ragu untuk menandai soal yang ingin ditinjau kembali sebelum selesai.' },
  { icon: EyeOff, title: 'Pindah tab dicatat', desc: 'Berpindah tab atau jendela selama ujian tercatat sebagai aktivitas dan dapat ditinjau admin.' },
  { icon: Send, title: 'Kirim otomatis saat waktu habis', desc: 'Ujian dikumpulkan otomatis ketika waktu habis. Soal kosong bernilai 0.' },
  { icon: Keyboard, title: 'Pintasan keyboard', desc: '← → pindah soal, A–E memilih jawaban, R menandai ragu-ragu.' },
];

export function TryoutDetailView({ id }) {
  const router = useRouter();
  const pkg = useResource(() => api.get(`/packages/${id}`), [id]);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const p = pkg.data;

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      const r = await api.post('/attempts', { package_id: id });
      router.push(`/ujian/${r.attempt_id}`);
    } catch (err) {
      setError(errorMessage(err));
      setStarting(false);
    }
  };

  if (pkg.error && !p) {
    return (
      <>
        <PageHead crumbs={[...CRUMBS, { label: 'Detail' }]} title="Detail tryout" />
        <Panel padding="none">
          <ErrorState error={pkg.error} title={pkg.error.status === 404 ? 'Paket tidak ditemukan' : 'Paket gagal dimuat'} onRetry={pkg.error.status === 404 ? undefined : () => pkg.reload()} />
        </Panel>
      </>
    );
  }

  if (!p) {
    return (
      <>
        <Panel className="mb-4">
          <Skeleton className="h-4 w-40" rounded="rounded-md" />
          <Skeleton className="mt-3 h-8 w-2/3 max-w-lg" rounded="rounded-lg" />
          <Skeleton className="mt-3 h-4 w-1/2 max-w-md" rounded="rounded-md" />
        </Panel>
        <div className="grid gap-4 lg:grid-cols-12 [&>*]:min-w-0">
          <PanelSkeleton className="lg:col-span-8" height="h-64" />
          <PanelSkeleton className="lg:col-span-4" height="h-64" />
        </div>
      </>
    );
  }

  const active = !!p.active_attempt_id;
  const available = p.availability === 'tersedia';
  const rows = SUBTESTS.map((s) => {
    const k = s.code.toLowerCase();
    const n = p.counts?.[s.code] || 0;
    return { ...s, n, max: n * POINTS_PER_QUESTION, pass: p[`pass_${k}`] };
  });
  const maxTotal = rows.reduce((a, r) => a + r.max, 0);

  return (
    <>
      <PageHead
        crumbs={[...CRUMBS, { label: 'Instruksi ujian' }]}
        mascot="/maskot/tryout.webp"
        title={p.title}
        description={p.description}
        meta={
          <>
            <Badge status={active ? 'berlangsung' : p.availability} />
            <Chip color="white" size="sm" icon={<Clock3 />} mono>
              {p.duration_minutes} menit
            </Chip>
            <Chip color="white" size="sm" icon={<FileText />} mono>
              {p.question_count} soal
            </Chip>
            <Chip color="white" size="sm" icon={<CalendarClock />}>
              {schedule(p)}
            </Chip>
            {p.shuffle_questions && (
              <Chip color="white" size="sm" icon={<Shuffle />}>
                Soal diacak
              </Chip>
            )}
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-12 [&>*]:min-w-0">
        <div className="space-y-4 lg:col-span-8">
          <Panel>
            <PanelHeader
              title="Komposisi & passing grade"
              info="TWK & TIU: benar 5 poin, salah/kosong 0. TKP: setiap opsi berbobot 1–5."
              subtitle={`Lulus bila setiap subtes mencapai passing grade${p.pass_total ? ` dan total ≥ ${p.pass_total}` : ''}.`}
              action={
                <span className="rounded-xl bg-ghost px-3 py-2 text-[13px] text-mist-700">
                  Skor maks <span className="font-semibold tabular-nums text-obsidian">{formatAngka(maxTotal)}</span>
                </span>
              }
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {rows.map((r) => (
                <div key={r.code} className={cn('rounded-2xl p-5 ring-1 ring-inset ring-mist-100', !r.n && 'bg-mist-50 opacity-70')}>
                  <div className="flex items-center justify-between">
                    <Chip color={SUBTEST_COLOR[r.code]} size="sm">
                      {r.code}
                    </Chip>
                    <span className="font-mono text-xs font-semibold tabular-nums text-obsidian-600">{r.n} soal</span>
                  </div>
                  <p className="mt-3 text-sm text-mist-700">{r.short}</p>
                  {r.n ? (
                    <>
                      <p className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                        {r.pass}
                        <span className="text-sm font-medium text-mist-500">/{r.max}</span>
                      </p>
                      <p className="mb-3 mt-1 text-xs text-mist-700">passing grade / maks</p>
                      <ProgressBar value={r.pass} max={r.max} color="obsidian" size="sm" />
                    </>
                  ) : (
                    <p className="mt-3 text-sm font-medium text-mist-700">Tidak diujikan di paket ini</p>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-mist-700">TWK &amp; TIU: benar 5 poin, salah/kosong 0. TKP: setiap opsi berbobot 1–5.</p>
          </Panel>

          <Panel>
            <PanelHeader title="Aturan ujian" info="Baca sebelum memulai — timer langsung berjalan setelah Anda menekan Mulai." />
            <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {RULES.map((r) => (
                <li key={r.title} className="flex gap-3.5">
                  <IconBox icon={r.icon} />
                  <div>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-mist-700">{r.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <section aria-label="Mulai ujian" className="rounded-[20px] bg-obsidian p-6 text-white sm:p-7 lg:sticky lg:top-24 lg:col-span-4 [&_a]:!shadow-none [&_button]:!shadow-none">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-mint">
            <Timer className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </span>
          <p className="mt-5 text-sm text-white/60">Durasi pengerjaan</p>
          <p className="mt-1 font-mono text-[44px] font-semibold leading-none tracking-tight tabular-nums">{formatTimer(p.duration_minutes * 60)}</p>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10">
            <div className="bg-obsidian p-4">
              <p className="text-xs text-white/55">Jumlah soal</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{p.question_count}</p>
            </div>
            <div className="bg-obsidian p-4">
              <p className="text-xs text-white/55">Percobaan</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{p.attempts_count}×</p>
            </div>
          </div>

          {error && (
            <FormAlert className="mt-5" title="Tidak dapat memulai">
              {error}
            </FormAlert>
          )}

          {active ? (
            <>
              <p className="mt-6 text-sm leading-relaxed text-white/70">Anda memiliki ujian yang sedang berlangsung. Lanjutkan sebelum waktunya habis.</p>
              <Button variant="mint" size="lg" fullWidth className="mt-4" icon={<RotateCw />} href={`/ujian/${p.active_attempt_id}`}>
                Lanjutkan ujian
              </Button>
            </>
          ) : available ? (
            <>
              <div className="mt-6 rounded-xl bg-white p-4 text-obsidian">
                <Checkbox
                  checked={ready}
                  onChange={(e) => setReady(e.target.checked)}
                  label="Saya siap memulai"
                  description="Saya sudah membaca aturan dan memahami bahwa timer langsung berjalan."
                />
              </div>
              <Button variant="mint" size="lg" fullWidth className="mt-4" icon={<Play />} disabled={!ready} loading={starting} onClick={start}>
                Mulai ujian
              </Button>
            </>
          ) : (
            <>
              <p className="mt-6 text-sm leading-relaxed text-white/70">
                {p.availability === 'belum_dibuka' ? `Paket ini belum dibuka. Jadwal: ${schedule(p)} WIB.` : 'Jadwal paket ini sudah ditutup.'}
              </p>
              <Button variant="secondary" size="lg" fullWidth className="mt-4" disabled icon={<Lock />}>
                {p.availability === 'belum_dibuka' ? 'Belum dibuka' : 'Ditutup'}
              </Button>
            </>
          )}
          {p.last_result && (
            <Button variant="link" className="mt-4 w-full !text-white/80 hover:!text-white" href={`/hasil/${p.last_result.attempt_id}`}>
              Lihat hasil terakhir ({formatAngka(p.last_result.score_total)})
            </Button>
          )}
        </section>
      </div>
    </>
  );
}

export default TryoutDetailView;
