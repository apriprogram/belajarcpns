'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Pause, Play, X } from 'lucide-react';
import { LogoMark } from '@/components/layout/Logo';
import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * Video tutorial hero: klik video → lightbox (video besar + kontrol); rail langkah di bawah video
 * dengan progres per bab, bisa diklik untuk melompat.
 */
export function HeroVideo({ className }) {
  const { brand, hero } = useSite();
  // Hiasan desktop (LandingContent): emblem di kiri bawah, maskot di kanan bawah → rail memberi ruang di kedua ujung.
  const emblemSpace = hero.emblem?.visible !== false && !!hero.emblem?.image_url;
  const mascotSpace = hero.mascot?.visible !== false && !!hero.mascot?.image_url;
  // Bab video (detik) — default dari scripts/record-hero-video.py
  const STEPS = [...(hero.steps || [])].sort((a, b) => (Number(a.start) || 0) - (Number(b.start) || 0));
  const SRC = hero.video_url || undefined;
  const POSTER = hero.poster_url || undefined;
  const videoRef = useRef(null);
  const wrapRef = useRef(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(44);
  const [open, setOpen] = useState(false);

  // Metadata bisa sudah termuat sebelum hidrasi (event onLoadedMetadata terlewat) → baca langsung.
  useEffect(() => {
    const v = videoRef.current;
    if (v && v.readyState >= 1 && Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
  }, [SRC]);

  // Jeda otomatis saat video tidak terlihat (hemat CPU/baterai).
  useEffect(() => {
    const v = videoRef.current;
    const el = wrapRef.current;
    if (!v || !el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused.current && !open) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [open]);

  const toggle = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    userPaused.current = !v.paused;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  const seek = (t) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = t;
    userPaused.current = false;
    v.play().catch(() => {});
  };

  const openModal = () => {
    videoRef.current?.pause();
    setOpen(true);
  };
  const closeModal = useCallback((resumeAt) => {
    setOpen(false);
    const v = videoRef.current;
    if (!v) return;
    if (typeof resumeAt === 'number' && Number.isFinite(resumeAt)) v.currentTime = resumeAt;
    if (!userPaused.current) v.play().catch(() => {});
  }, []);

  const active = STEPS.reduce((acc, s, i) => (time >= s.start ? i : acc), 0);

  return (
    <div ref={wrapRef} className={className}>
      {/* ---------- Kartu video ---------- */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Perbesar video tutorial"
        onClick={openModal}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openModal();
          }
        }}
        className="group relative cursor-zoom-in overflow-hidden rounded-[28px] bg-ghost ring-1 ring-inset ring-mist-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
      >
        <video
          ref={videoRef}
          className="block aspect-[16/10] w-full object-cover"
          src={SRC}
          poster={POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Video tutorial: daftar akun, pilih tryout, lalu simulasi ujian CBT"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        />

        {/* Tirai tipis + tombol perbesar saat hover (tanpa zoom pada video) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-obsidian/0 transition-colors duration-300 group-hover:bg-obsidian/10">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-obsidian opacity-0 shadow-float transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
            <Maximize2 className="h-5 w-5" />
          </span>
        </div>

        {/* Kontrol kecil */}
        <button
          type="button"
          onClick={toggle}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-obsidian backdrop-blur transition-colors hover:bg-white"
          aria-label={playing ? 'Jeda video' : 'Putar video'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <span className={cn('pointer-events-none absolute bottom-3 right-3 rounded-full bg-obsidian/70 px-2.5 py-1 font-mono text-[11px] font-medium text-white backdrop-blur', mascotSpace && cn('lg:right-auto', emblemSpace ? 'lg:left-[44px]' : 'lg:left-3'))}>
          {fmt(time)} / {fmt(duration)}
        </span>
      </div>

      {/* ---------- Rail langkah (di bawah video) ---------- */}
      {STEPS.length > 0 && (
      <div className="mt-4 flex items-center gap-2.5">
        <span className={cn('hidden shrink-0 items-center sm:flex', emblemSpace && 'lg:hidden')}>
          <LogoMark className="!h-10 !w-10 !rounded-full" />
        </span>
        {emblemSpace && <span aria-hidden className="hidden shrink-0 lg:block lg:w-[8px] xl:w-[20px] 2xl:w-[16px]" />}
        <ol className="grid min-w-0 flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }}>
          {STEPS.map((s, i) => {
            const end = STEPS[i + 1]?.start ?? duration;
            const pct = i < active ? 100 : i > active ? 0 : Math.min(100, ((time - s.start) / Math.max(1, end - s.start)) * 100);
            const on = i === active;
            return (
              <li key={`${i}-${s.label}`} className="min-w-0">
                <button
                  type="button"
                  onClick={() => seek(s.start)}
                  aria-current={on ? 'step' : undefined}
                  className={cn(
                    'group/step relative flex h-11 w-full items-center overflow-hidden rounded-full px-4 text-left ring-1 lg:px-3 min-[1440px]:px-4 ring-inset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
                    on ? 'bg-white ring-mist-100' : 'bg-ghost ring-transparent hover:bg-mist-50',
                  )}
                >
                  {/* Progres bab = isian biru muda di belakang label */}
                  <span aria-hidden className="absolute inset-y-0 left-0 bg-cobalt-50 transition-[width] duration-300 ease-linear" style={{ width: `${pct}%` }} />
                  <span className="relative flex min-w-0 items-center gap-2">
                    <span className={cn('-ml-2.5 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-colors sm:flex lg:hidden min-[1440px]:flex', on ? 'bg-obsidian text-white' : pct >= 100 ? 'bg-cobalt text-white' : 'bg-white text-mist-700 ring-1 ring-inset ring-mist-100')}>
                      {i + 1}
                    </span>
                    <span className={cn('truncate text-[12px] font-semibold leading-tight sm:text-[13px] lg:text-[12px] xl:text-[13px]', on ? 'text-obsidian' : 'text-obsidian-600')}>{s.label}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {mascotSpace && <span aria-hidden className="hidden shrink-0 lg:block lg:w-[66px] xl:w-[108px] 2xl:w-[80px]" />}
      </div>
      )}

      {open && <Lightbox startAt={time} onClose={closeModal} steps={STEPS} src={SRC} poster={POSTER} title={`Tutorial ${brand.name}`} caption={hero.video_caption} />}
    </div>
  );
}

/** Lightbox video: video besar dengan kontrol bawaan + bab yang bisa diklik. Escape/klik latar menutup. */
function Lightbox({ startAt, onClose, steps: STEPS, src: SRC, poster: POSTER, title, caption }) {
  const ref = useRef(null);
  const closeBtn = useRef(null);
  const [t, setT] = useState(startAt);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const lastActive = document.activeElement;
    closeBtn.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose(ref.current?.currentTime);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      lastActive?.focus?.();
    };
  }, [onClose]);

  const active = STEPS.reduce((acc, s, i) => (t >= s.start ? i : acc), 0);
  const close = () => onClose(ref.current?.currentTime);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-8" role="dialog" aria-modal="true" aria-label={`Video ${title.charAt(0).toLowerCase()}${title.slice(1)}`}>
      <div className="absolute inset-0 animate-fade-in bg-obsidian/75" onClick={close} aria-hidden />
      <div className="relative w-full max-w-5xl animate-scale-in overflow-hidden rounded-[24px] bg-obsidian p-2 shadow-float ring-1 ring-inset ring-white/10">
        <video
          ref={ref}
          src={SRC}
          poster={POSTER}
          controls
          autoPlay
          playsInline
          className="aspect-[16/10] w-full rounded-[18px] bg-black"
          onLoadedMetadata={(e) => {
            e.currentTarget.currentTime = startAt || 0;
          }}
          onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
        />
        <div className="flex flex-col gap-3 px-3 pb-2 pt-3 text-white sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LogoMark inverted className="!h-9 !w-9 !rounded-full" />
            <div>
              <p className="text-sm font-semibold">{title}</p>
              {caption && <p className="text-xs text-white/55">{caption}</p>}
            </div>
          </div>
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((s, i) => (
              <li key={`${i}-${s.label}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (ref.current) {
                      ref.current.currentTime = s.start;
                      ref.current.play().catch(() => {});
                    }
                  }}
                  aria-current={i === active ? 'step' : undefined}
                  className={cn('h-8 rounded-full px-3 text-[13px] font-medium transition-colors', i === active ? 'bg-white text-obsidian' : 'bg-white/10 text-white/80 hover:bg-white/20')}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        </div>
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-obsidian transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          aria-label="Tutup video"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default HeroVideo;
