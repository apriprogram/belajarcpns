'use client';

import { useState } from 'react';
import { CalendarDays, CalendarRange, Earth, Eye, Laptop, MonitorSmartphone, Radio, Smartphone, Tablet, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAngka } from '@/lib/format';
import { BarChart, ChartLegend, ErrorState, SegmentedControl, Skeleton } from '@/components/ui';
import { DeltaPill, IconBox, Panel, PanelHeader } from '@/components/admin/AdminUI';
import { useResource } from '@/components/admin/shared';

const GRANS = [
  { value: 'harian', label: 'Harian' },
  { value: 'mingguan', label: 'Mingguan' },
  { value: 'bulanan', label: 'Bulanan' },
  { value: 'tahunan', label: 'Tahunan' },
];

const regionName = (() => {
  try {
    const dn = new Intl.DisplayNames(['id'], { type: 'region' });
    return (code) => (code === 'ZZ' ? 'Tidak diketahui' : dn.of(code) || code);
  } catch {
    return (code) => (code === 'ZZ' ? 'Tidak diketahui' : code);
  }
})();
const DEVICE = { desktop: { label: 'Desktop', icon: Laptop }, mobile: { label: 'Ponsel', icon: Smartphone }, tablet: { label: 'Tablet', icon: Tablet } };

/** Panel statistik pengunjung untuk dashboard admin (GET /api/admin/visits/stats). */
export function VisitorStats() {
  const [gran, setGran] = useState('harian');
  const { data, loading, error, reload } = useResource(() => api.get('/admin/visits/stats', { query: { granularity: gran } }), [gran]);
  const t = data?.totals || {};
  const today = t.today || {};
  const yest = t.yesterday || {};
  const delta = yest.visitors ? Math.round(((today.visitors - yest.visitors) / yest.visitors) * 100) : null;
  const countries = data?.countries || [];
  const totalCountryVisitors = countries.reduce((a, c) => a + c.visitors, 0) || 1;
  const devices = data?.devices || [];
  const totalDev = devices.reduce((a, d) => a + d.visitors, 0) || 1;

  const tiles = [
    { key: 'all', title: 'Total semua', icon: Eye, tone: 'obsidian' },
    { key: 'today', title: 'Hari ini', icon: CalendarDays },
    { key: 'week', title: 'Minggu ini', icon: CalendarRange },
    { key: 'month', title: 'Bulan ini', icon: CalendarRange },
    { key: 'year', title: 'Tahun ini', icon: CalendarRange },
  ];

  if (error) {
    return (
      <Panel padding="none">
        <ErrorState error={error} onRetry={() => reload()} title="Statistik pengunjung gagal dimuat" />
      </Panel>
    );
  }

  return (
    <section aria-label="Statistik pengunjung" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-obsidian">Statistik pengunjung</h2>
          <p className="text-sm text-mist-700">Kunjungan website (halaman publik & peserta). Zona waktu WIB.</p>
        </div>
        <span className="inline-flex h-8 items-center gap-2 rounded-full bg-mint-50 px-3 text-xs font-semibold text-mint-700 ring-1 ring-inset ring-mint-100">
          <Radio className="h-3.5 w-3.5" aria-hidden /> {loading ? '—' : formatAngka(data?.online_now || 0)} aktif 5 menit terakhir
        </span>
      </div>

      {/* Ringkasan periode */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((x) => {
          const v = t[x.key] || {};
          const Icon = x.icon;
          return (
            <Panel key={x.key} className={cn('flex flex-col', x.key === 'all' && '!bg-obsidian !ring-obsidian text-white sm:col-span-2 lg:col-span-1')}>
              <div className="flex items-center justify-between">
                <p className={cn('text-[14px] font-semibold', x.key === 'all' ? 'text-white' : 'text-obsidian')}>{x.title}</p>
                {x.key === 'today' && !loading && delta != null && (
                  <DeltaPill tone={delta < 0 ? 'danger' : 'mint'}>
                    {delta > 0 ? '+' : ''}
                    {delta}%
                  </DeltaPill>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <IconBox icon={<Icon />} tone={x.key === 'all' ? 'dark' : undefined} />
                {loading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{formatAngka(v.visitors || 0)}</p>
                )}
              </div>
              <p className={cn('mt-2 text-xs', x.key === 'all' ? 'text-white/70' : 'text-mist-700')}>
                pengunjung unik · <span className={cn('font-semibold', x.key === 'all' ? 'text-white' : 'text-obsidian')}>{loading ? '—' : formatAngka(v.views || 0)}</span> tayangan
              </p>
            </Panel>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-12 [&>*]:min-w-0">
        {/* Tren */}
        <Panel className="flex flex-col xl:col-span-8">
          <PanelHeader
            title="Tren kunjungan"
            info="Pengunjung unik dan tayangan halaman per periode."
            action={<SegmentedControl size="sm" ariaLabel="Rentang tren" value={gran} onChange={setGran} options={GRANS} />}
          />
          <ChartLegend
            items={[
              { label: 'Pengunjung unik', color: '#3765F6' },
              { label: 'Tayangan', color: '#C3CED7' },
            ]}
          />
          <div className="mt-4 flex-1">
            {loading ? (
              <Skeleton className="h-[260px] w-full" rounded="rounded-xl" />
            ) : (
              <BarChart
                data={data?.series || []}
                height={260}
                ariaLabel="Grafik tren kunjungan"
                formatY={(v) => (Number.isInteger(v) ? formatAngka(v) : '')}
                series={[
                  { key: 'visitors', label: 'Pengunjung unik' },
                  { key: 'views', label: 'Tayangan' },
                ]}
                formatValue={(v) => formatAngka(v)}
                emptyText="Belum ada kunjungan"
              />
            )}
          </div>
        </Panel>

        {/* Perangkat + halaman */}
        <div className="flex flex-col gap-4 xl:col-span-4">
          <Panel>
            <PanelHeader title="Perangkat" info="Pembagian pengunjung unik per jenis perangkat." />
            <div className="space-y-3">
              {loading
                ? [0, 1, 2].map((k) => <Skeleton key={k} className="h-8 w-full" />)
                : devices.length === 0
                  ? <p className="text-sm text-mist-700">Belum ada data.</p>
                  : devices.map((d) => {
                      const meta = DEVICE[d.key] || { label: d.key, icon: MonitorSmartphone };
                      const Icon = meta.icon;
                      const pct = Math.round((d.visitors / totalDev) * 100);
                      return (
                        <div key={d.key} className="flex items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0 text-mist-700" aria-hidden />
                          <span className="w-16 text-sm font-medium">{meta.label}</span>
                          <span className="h-2 flex-1 overflow-hidden rounded-full bg-mist-100">
                            <span className="block h-full rounded-full bg-cobalt" style={{ width: `${pct}%` }} />
                          </span>
                          <span className="w-10 text-right text-sm tabular-nums text-mist-700">{pct}%</span>
                        </div>
                      );
                    })}
            </div>
          </Panel>
          <Panel className="flex-1">
            <PanelHeader title="Halaman terpopuler" info="Berdasarkan pengunjung unik." />
            <ol className="space-y-2.5">
              {loading
                ? [0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-6 w-full" />)
                : (data?.pages || []).slice(0, 6).map((p, i) => (
                    <li key={p.key} className="flex items-center gap-3 text-sm">
                      <span className="w-5 font-mono text-xs text-mist-500">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium text-obsidian">{p.key}</span>
                      <span className="tabular-nums text-mist-700">{formatAngka(p.visitors)}</span>
                    </li>
                  ))}
            </ol>
          </Panel>
        </div>
      </div>

      {/* Negara */}
      <Panel>
        <PanelHeader title="Asal negara" info="Negara dari header CDN/proxy (mis. Cloudflare); tanpa itu diperkirakan dari bahasa browser." action={<IconBox icon={<Earth />} />} />
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">{[0, 1, 2, 3].map((k) => <Skeleton key={k} className="h-10 w-full" />)}</div>
        ) : countries.length === 0 ? (
          <p className="text-sm text-mist-700">Belum ada kunjungan tercatat.</p>
        ) : (
          <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {countries.map((c) => {
              const pct = (c.visitors / totalCountryVisitors) * 100;
              return (
                <li key={c.key} className="flex items-center gap-3">
                  <span className="flex h-8 w-10 shrink-0 items-center justify-center rounded-lg bg-cobalt-50 font-mono text-xs font-semibold text-cobalt-700 ring-1 ring-inset ring-cobalt-100" aria-hidden>
                    {c.key === 'ZZ' ? '??' : c.key}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-obsidian">{regionName(c.key)}</span>
                      <span className="shrink-0 tabular-nums text-mist-700">
                        <span className="font-semibold text-obsidian">{formatAngka(c.visitors)}</span> · {pct.toFixed(pct < 10 ? 1 : 0)}%
                      </span>
                    </div>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-mist-100">
                      <span className="block h-full rounded-full bg-cobalt" style={{ width: `${Math.max(2, pct)}%` }} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 flex items-center gap-1.5 text-xs text-mist-500">
          <Users className="h-3.5 w-3.5" aria-hidden /> Pengunjung unik dihitung per browser (anonim, tanpa menyimpan IP).
        </p>
      </Panel>
    </section>
  );
}

export default VisitorStats;
