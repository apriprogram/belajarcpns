'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, Flag } from 'lucide-react';
import { cn } from '@/lib/cn';

const OPTIONS = ['A', 'B', 'C', 'D', 'E'];
const TOTAL_GRID = 20;

/**
 * Mockup ruang ujian CBT yang "hidup": timer berjalan mundur, jawaban berganti,
 * nomor soal bertambah, dan chip "Tersimpan otomatis" berkedip. Hanya aktif saat terlihat.
 */
export function CbtMockup({ className }) {
  const ref = useRef(null);
  const [secs, setSecs] = useState(84 * 60 + 8);
  const [q, setQ] = useState(13); // indeks soal aktif (0-based) → tampil "14"
  const [picked, setPicked] = useState(1); // B
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let timer = 0;
    let step = 0;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        setSecs((s) => (s > 0 ? s - 1 : 100 * 60));
        step += 1;
        if (step % 3 === 0) {
          // pilih jawaban → simpan → lanjut soal
          setPicked(Math.floor(Math.random() * 5));
          setSaved(false);
          setTimeout(() => setSaved(true), 650);
        }
        if (step % 6 === 0) setQ((n) => (n + 1) % TOTAL_GRID);
      }, 1000);
    };
    const stop = () => {
      clearInterval(timer);
      timer = 0;
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.2 });
    io.observe(el);
    return () => {
      stop();
      io.disconnect();
    };
  }, []);

  const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div ref={ref} className={cn('relative', className)}>
      {/* Layar ujian */}
      <div className="overflow-hidden rounded-[18px] bg-white ring-1 ring-inset ring-mist-100">
        {/* header */}
        <div className="flex items-center justify-between border-b border-mist-100 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-cobalt-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-cobalt-700">TIU</span>
            <span className="text-[12px] font-semibold">
              Soal <span className="tabular-nums">{q + 1}</span>
              <span className="text-mist-500">/110</span>
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ghost px-2.5 py-1 font-mono text-[12px] font-semibold tabular-nums">
            <Clock3 className="h-3.5 w-3.5 text-cobalt" />
            {hh}:{mm}:{ss}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3 p-4">
          {/* soal + opsi */}
          <div className="min-w-0">
            <div className="space-y-1.5">
              <span className="block h-2 w-[92%] rounded-full bg-mist-100" />
              <span className="block h-2 w-[70%] rounded-full bg-mist-100" />
            </div>
            <ul className="mt-3 space-y-1.5">
              {OPTIONS.map((o, i) => (
                <li
                  key={o}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ring-inset transition-colors duration-300',
                    picked === i ? 'bg-cobalt text-white ring-cobalt' : 'bg-white ring-mist-100',
                  )}
                >
                  <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold', picked === i ? 'bg-white/20' : 'bg-ghost text-mist-700')}>{o}</span>
                  <span className={cn('block h-1.5 rounded-full', picked === i ? 'bg-white/60' : 'bg-mist-100')} style={{ width: `${48 + ((i * 37) % 40)}%` }} />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-ghost px-2 text-[10px] font-medium text-obsidian-600">
                <Flag className="h-3 w-3" /> Ragu
              </span>
              <span className="inline-flex h-6 items-center rounded-full bg-obsidian px-2.5 text-[10px] font-medium text-white">Berikutnya →</span>
            </div>
          </div>

          {/* grid nomor */}
          <div className="w-[96px] shrink-0 rounded-xl bg-ghost p-2">
            <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-mist-700">Navigasi</p>
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: TOTAL_GRID }, (_, i) => {
                const st = i === q ? 'cur' : i < q ? (i % 7 === 3 ? 'ragu' : 'ok') : 'none';
                return (
                  <span
                    key={i}
                    className={cn(
                      'flex h-[18px] items-center justify-center rounded-[5px] font-mono text-[8px] font-semibold transition-colors duration-300',
                      st === 'cur' && 'bg-white text-obsidian ring-2 ring-obsidian',
                      st === 'ok' && 'bg-cobalt text-white',
                      st === 'ragu' && 'bg-warning text-obsidian',
                      st === 'none' && 'bg-white text-mist-500',
                    )}
                  >
                    {i + 1}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chip melayang */}
      <span
        className={cn(
          'absolute -left-3 top-[16%] inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold ring-1 ring-inset ring-mist-100 transition-all duration-300',
          saved ? 'text-mint-700' : 'text-mist-700',
        )}
      >
        <CheckCircle2 className={cn('h-3.5 w-3.5', saved ? 'text-mint-700' : 'animate-pulse text-mist-500')} />
        {saved ? 'Tersimpan otomatis' : 'Menyimpan…'}
      </span>
      <span className="absolute -right-3 -top-3 inline-flex items-center gap-1.5 rounded-full bg-obsidian px-3 py-1.5 text-[11px] font-semibold text-white">
        <span className="h-1.5 w-1.5 rounded-full bg-mint" />
        Timer server
      </span>
    </div>
  );
}

export default CbtMockup;
