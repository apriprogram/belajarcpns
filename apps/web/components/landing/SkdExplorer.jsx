'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock3, ShieldCheck, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';
import { Reveal } from './Motion';
import { RichText } from './RichText';

// Gaya per urutan subtes (konten dari site.skd.subtests).
const TONES = [
  { color: '#3765F6', tint: 'bg-cobalt-50 text-cobalt-700', bar: 'bg-cobalt' },
  { color: '#F5B301', tint: 'bg-warning-50 text-warning-700', bar: 'bg-warning' },
  { color: '#3FD46A', tint: 'bg-mint-50 text-mint-700', bar: 'bg-mint-700' },
];
const R = 92;
const C = 2 * Math.PI * R;
const GAP = 8;

/**
 * Section SKD interaktif: donat komposisi soal (tergambar saat terlihat) + daftar subtes.
 * Subtes aktif berganti otomatis tiap beberapa detik; berhenti saat pengguna berinteraksi.
 */
export function SkdExplorer() {
  const { skd } = useSite();
  const SUBTESTS = (skd.subtests || []).map((st, i) => ({
    ...TONES[i % TONES.length],
    ...st,
    count: Number(st.count) || 0,
    max: Number(st.max) || 0,
    pass: Number(st.pass) || 0,
    topics: st.topics || [],
  }));
  const TOTAL = SUBTESTS.reduce((a, s) => a + s.count, 0);
  const DIV = TOTAL || 1;
  const MAX_SCORE = SUBTESTS.reduce((a, s) => a + s.max, 0);
  const [picked, setActive] = useState(0);
  const active = Math.min(picked, Math.max(0, SUBTESTS.length - 1));
  const [inView, setInView] = useState(false);
  const [auto, setAuto] = useState(true);
  const [hovering, setHovering] = useState(false);
  const rootRef = useRef(null);
  const count = SUBTESTS.length;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Ganti otomatis selama terlihat, belum disentuh pengguna, dan tidak sedang di-hover.
  useEffect(() => {
    if (!inView || !auto || hovering) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (count < 2) return undefined;
    const t = setInterval(() => setActive((a) => (Math.min(a, count - 1) + 1) % count), 4200);
    return () => clearInterval(t);
  }, [inView, auto, hovering, count]);

  const pick = (i) => {
    setAuto(false);
    setActive(i);
  };

  const cur = SUBTESTS[active];
  let offset = 0;
  if (!cur) return null;

  return (
    <div ref={rootRef} className="grid gap-4 sm:gap-5 lg:grid-cols-12 xl:gap-6" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      {/* ---------- Donat komposisi ---------- */}
      <Reveal variant="scale" className="lg:col-span-5">
        <div className="card-flat flex h-full flex-col p-5 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold sm:text-[15px]">Komposisi soal</p>
            <span className="rounded-full bg-ghost px-3 py-1 font-mono text-xs font-semibold">{TOTAL} soal</span>
          </div>

          <div className="relative mx-auto my-5 aspect-square w-full max-w-[220px] sm:my-6 sm:max-w-[280px] lg:my-auto lg:py-6">
            <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" role="img" aria-label={`Komposisi soal: ${SUBTESTS.map((s) => `${s.code} ${s.count}`).join(', ')}`}>
              <circle cx="120" cy="120" r={R} fill="none" stroke="#E7ECF0" strokeWidth="22" />
              {SUBTESTS.map((s, i) => {
                const len = Math.max(0, (s.count / DIV) * C - GAP);
                const start = offset;
                offset += (s.count / DIV) * C;
                const on = i === active;
                return (
                  <circle
                    key={`${i}-${s.code}`}
                    cx="120"
                    cy="120"
                    r={R}
                    fill="none"
                    stroke={s.color}
                    strokeLinecap="butt"
                    strokeWidth={on ? 28 : 22}
                    strokeDasharray={inView ? `${len} ${C - len}` : `0 ${C}`}
                    strokeDashoffset={-(start + GAP / 2)}
                    className="cursor-pointer transition-[stroke-dasharray,stroke-width,opacity] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
                    style={{ opacity: on ? 1 : 0.35 }}
                    onClick={() => pick(i)}
                  />
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span key={`n-${active}`} className="animate-fade-up text-[28px] font-semibold leading-none sm:text-[56px] tracking-tightest tabular-nums">
                {cur.count}
              </span>
              <span key={`l-${active}`} className="mt-1.5 animate-fade-up text-[13px] text-mist-700 sm:mt-2 sm:text-sm">
                soal <span className="font-semibold text-obsidian">{cur.code}</span> · {Math.round((cur.count / DIV) * 100)}%
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2">
            {[
              [Clock3, String(skd.duration_minutes ?? ''), 'menit'],
              [Trophy, String(MAX_SCORE), 'skor maks'],
              [ShieldCheck, String(SUBTESTS.length), 'subtes wajib lulus'],
            ].map(([Icon, v, l]) => (
              <div key={l} className="flex min-w-0 flex-col items-center rounded-2xl bg-ghost px-2 py-2.5 text-center sm:block sm:px-4 sm:py-3 sm:text-left">
                <Icon className="hidden h-4 w-4 text-mist-700 sm:block" strokeWidth={1.75} aria-hidden />
                <dd className="text-lg font-semibold leading-tight tabular-nums tracking-tight sm:mt-2 sm:text-xl sm:leading-7">{v}</dd>
                <dt className="mt-0.5 text-xs leading-tight text-mist-700 sm:mt-0 sm:leading-4">{l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>

      {/* ---------- Daftar subtes ---------- */}
      <div className="flex flex-col gap-3 lg:col-span-7" role="tablist" aria-label="Subtes SKD">
        {SUBTESTS.map((s, i) => {
          const on = i === active;
          const pct = s.max > 0 ? Math.min(100, (s.pass / s.max) * 100) : 0;
          return (
            <Reveal key={`${i}-${s.code}`} delay={120 + i * 110}>
              <div
                className={cn(
                  'relative overflow-hidden rounded-[24px] ring-1 ring-inset transition-colors duration-500',
                  on ? 'bg-white ring-cobalt/30' : 'bg-ghost/70 ring-transparent hover:bg-ghost',
                )}
              >
                {/* garis waktu auto-ganti */}
                {on && auto && inView && !hovering && <span key={`t-${active}`} className="skd-timer absolute inset-x-0 top-0 h-[3px] origin-left" style={{ background: s.color }} aria-hidden />}
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => pick(i)}
                  className="flex w-full items-center gap-3 rounded-[24px] p-4 text-left sm:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt sm:p-6"
                >
                  <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold sm:h-12 sm:w-12 sm:rounded-2xl sm:text-[13px]', s.tint)}>{s.code}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold tracking-tight sm:text-xl">{s.name}</span>
                    <span className="mt-0.5 block text-[13px] text-mist-700">{s.scoring}</span>
                  </span>
                  <span className="hidden text-right sm:block">
                    <span className="block text-2xl font-semibold leading-none tabular-nums tracking-tight">{s.count}</span>
                    <span className="text-xs text-mist-700">soal</span>
                  </span>
                  <span className="hidden h-10 w-px bg-mist-100 sm:block" aria-hidden />
                  <span className="text-right">
                    <span className="block text-[20px] font-semibold leading-none tabular-nums tracking-tight sm:text-2xl sm:leading-none">{s.max}</span>
                    <span className="text-xs text-mist-700">skor maks</span>
                  </span>
                </button>

                {/* Detail: membuka dengan animasi tinggi */}
                <div className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ gridTemplateRows: on ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden" inert={!on}>
                    <div className={cn('px-4 pb-5 transition-opacity duration-500 sm:px-6 sm:pb-6', on ? 'opacity-100' : 'opacity-0')}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-mist-700">Passing grade</span>
                        <span className="font-semibold tabular-nums">
                          {s.pass}
                          <span className="font-normal text-mist-500">/{s.max}</span>
                          <span className="ml-2 rounded-full bg-ghost px-2 py-0.5 text-xs font-medium text-obsidian-600">{Math.round(pct)}%</span>
                        </span>
                      </div>
                      <div className="relative mt-3 h-2.5 rounded-full bg-mist-100">
                        <div className={cn('h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(.2,.8,.2,1)]', s.bar)} style={{ width: on ? `${pct}%` : '0%' }} />
                        <span className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-obsidian transition-[left] duration-1000" style={{ left: on ? `${pct}%` : '0%' }} aria-hidden />
                      </div>
                      <ul className="mt-4 flex flex-wrap gap-1.5 sm:mt-5" aria-label={`Materi ${s.code}`}>
                        {s.topics.map((t, ti) => (
                          <li
                            key={`${ti}-${t}`}
                            className={cn('rounded-full bg-ghost px-3 py-1.5 text-[13px] text-obsidian-600 transition-all duration-500', on ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0')}
                            style={{ transitionDelay: on ? `${200 + ti * 50}ms` : '0ms' }}
                          >
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
        {skd.note && (
          <Reveal delay={480}>
            <p className="flex items-center gap-2 px-2 pt-1 text-[13px] text-mist-700 [&_b]:font-semibold [&_b]:text-obsidian">
              <ShieldCheck className="h-4 w-4 text-mint-700" strokeWidth={2} aria-hidden />
              <span>
                <RichText text={skd.note} />
              </span>
            </p>
          </Reveal>
        )}
      </div>
    </div>
  );
}

export default SkdExplorer;
