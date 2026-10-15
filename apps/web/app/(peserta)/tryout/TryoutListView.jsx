'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, BarChart3, CalendarClock, CalendarDays, Clock3, FileText, Lock, Play, RotateCw, Search, Timer } from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { formatAngka, formatJam, formatTanggal } from '@/lib/format';
import { Badge, Button, Chip, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useResource } from '@/components/peserta/hooks';
import { Composition } from '@/components/peserta/Composition';
import { schedule, shortCode } from '@/components/peserta/constants';
import { IconBox, PageHead, Panel, SearchField, Segmented } from '../_components/kit';

export function TryoutListView() {
  const pkgs = useResource(() => api.get('/packages'), []);
  const [tab, setTab] = useState('semua');
  const [q, setQ] = useState('');
  const list = useMemo(() => pkgs.data || [], [pkgs.data]);
  const counts = {
    semua: list.length,
    tersedia: list.filter((p) => p.availability === 'tersedia').length,
    selesai: list.filter((p) => p.last_result).length,
  };
  const term = q.trim().toLowerCase();
  const shown = list
    .filter((p) => (tab === 'tersedia' ? p.availability === 'tersedia' : tab === 'selesai' ? !!p.last_result : true))
    .filter((p) => !term || `${p.title} ${p.description || ''}`.toLowerCase().includes(term));

  return (
    <>
      <PageHead
        crumbs={[{ href: '/dashboard', label: 'Dashboard' }, { label: 'Tryout' }]}
        title="Tryout"
        mascot="/maskot/tryout.webp"
        description="Pilih paket, baca instruksi, lalu kerjakan dengan timer server seperti ujian SKD sesungguhnya."
        actions={
          <Button variant="secondary" icon={<BarChart3 />} href="/riwayat">
            Riwayat hasil
          </Button>
        }
      />

      <Panel padding="none" className="mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          ariaLabel="Filter paket"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'semua', label: 'Semua', count: pkgs.data ? counts.semua : undefined },
            { value: 'tersedia', label: 'Tersedia', count: pkgs.data ? counts.tersedia : undefined },
            { value: 'selesai', label: 'Selesai', count: pkgs.data ? counts.selesai : undefined },
          ]}
        />
        <SearchField value={q} onChange={setQ} placeholder="Cari paket tryout…" />
      </Panel>

      {pkgs.error && !pkgs.data ? (
        <Panel padding="none">
          <ErrorState error={pkgs.error} onRetry={() => pkgs.reload()} title="Daftar paket gagal dimuat" />
        </Panel>
      ) : pkgs.loading && !pkgs.data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Panel key={i}>
              <Skeleton className="h-4 w-24" rounded="rounded-md" />
              <Skeleton className="mt-4 h-6 w-3/4" rounded="rounded-md" />
              <Skeleton className="mt-3 h-4 w-1/2" rounded="rounded-md" />
              <Skeleton className="mt-8 h-11 w-full" rounded="rounded-xl" />
            </Panel>
          ))}
        </div>
      ) : !shown.length ? (
        <Panel padding="none">
          <EmptyState
            icon={term ? <Search /> : <Timer />}
            title={term ? 'Paket tidak ditemukan' : tab === 'selesai' ? 'Belum ada paket yang dikerjakan' : 'Belum ada paket tersedia'}
            description={
              term
                ? `Tidak ada paket yang cocok dengan “${q.trim()}”.`
                : tab === 'selesai'
                  ? 'Mulai tryout pertama Anda dari tab Semua.'
                  : 'Paket tryout baru akan muncul di sini setelah diterbitkan admin.'
            }
            action={
              term || tab !== 'semua' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setQ('');
                    setTab('semua');
                  }}
                >
                  Lihat semua paket
                </Button>
              ) : null
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <PackageCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </>
  );
}

function PackageCard({ p }) {
  const active = !!p.active_attempt_id;
  const status = active ? 'berlangsung' : p.availability;
  return (
    <Panel padding="none" className={cn('flex flex-col p-5 sm:p-6', active && '!ring-2 !ring-cobalt-100')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconBox icon={Timer} tone={active ? 'cobalt' : 'plain'} />
          <span className="font-mono text-xs font-medium text-mist-700">{shortCode(p.id)}</span>
        </div>
        <Badge status={status} size="sm" />
      </div>
      <h2 className="mt-4 line-clamp-2 text-[17px] font-semibold leading-snug tracking-[-0.01em] md:min-h-[46px]">{p.title}</h2>
      <p className="mt-1.5 line-clamp-2 min-h-[40px] text-sm leading-relaxed text-mist-700">{p.description || 'Paket tryout SKD.'}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Chip color="white" size="sm" icon={<Clock3 />} mono>
          {p.duration_minutes} menit
        </Chip>
        <Chip color="white" size="sm" icon={<FileText />} mono>
          {p.question_count} soal
        </Chip>
        <Chip color="white" size="sm" icon={p.start_at || p.end_at ? <CalendarClock /> : <CalendarDays />}>
          {schedule(p)}
        </Chip>
      </div>
      <div className="mt-5 border-t border-mist-100 pt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-mist-700">Komposisi soal</span>
          <span className="font-mono font-semibold tabular-nums text-obsidian-600" title="Passing grade TWK/TIU/TKP">
            PG {p.pass_twk}/{p.pass_tiu}/{p.pass_tkp}
          </span>
        </div>
        <Composition counts={p.counts} />
      </div>
      <div className="mt-4 flex min-h-[44px] items-center justify-between gap-3 rounded-xl bg-ghost px-3.5 py-2.5 text-sm">
        {p.last_result ? (
          <>
            <span className="text-mist-700">
              Hasil terakhir <span className="ml-1 font-semibold tabular-nums text-obsidian">{formatAngka(p.last_result.score_total)}</span>
            </span>
            <Badge status={p.last_result.passed ? 'lulus' : 'gagal'} size="sm" />
          </>
        ) : (
          <span className="text-mist-700">Belum pernah dikerjakan</span>
        )}
      </div>
      <div className="mt-auto flex gap-2 pt-5 [&_a]:!shadow-none [&_button]:!shadow-none">
        {active ? (
          <Button variant="accent" fullWidth icon={<RotateCw />} href={`/ujian/${p.active_attempt_id}`}>
            Lanjutkan
          </Button>
        ) : p.availability === 'tersedia' ? (
          <Button fullWidth icon={<Play />} href={`/tryout/${p.id}`}>
            {p.last_result ? 'Kerjakan lagi' : 'Mulai'}
          </Button>
        ) : (
          <Button fullWidth variant="secondary" disabled icon={<Lock />}>
            {p.availability === 'belum_dibuka' ? `Dibuka ${p.start_at ? formatTanggal(p.start_at, 'day-month') + ', ' + formatJam(p.start_at) : ''}` : 'Ditutup'}
          </Button>
        )}
        {p.last_result && (
          <Button variant="secondary" href={`/hasil/${p.last_result.attempt_id}`} iconRight={<ArrowRight />} className="shrink-0">
            Hasil
          </Button>
        )}
      </div>
    </Panel>
  );
}

export default TryoutListView;
