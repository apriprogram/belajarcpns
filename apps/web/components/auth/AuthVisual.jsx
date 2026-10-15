'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';
import { SITE_DEFAULTS } from '@/lib/site-defaults';
import { siteHost } from '@/lib/seo';
import s from './AuthVisual.module.css';

const DEFAULT_DURATION = 5000;

/**
 * Panel media kiri halaman auth (ala Magnific): slide cross-fade otomatis, judul + subjudul putih,
 * baris label tab dengan bar progres tipis. Jeda saat hover/fokus atau lewat tombol; tanpa autoplay
 * bila pengguna memilih reduced motion.
 */
export function AuthVisual({ className }) {
  const site = useSite();
  const { brand, auth } = site;
  const domain = siteHost(site); // domain asli (SITE_URL / Atur Website → SEO)
  // Slide dari site.auth.slides ({ label, title, subtitle, image | video, poster, start, duration }).
  const SLIDES = (auth.slides?.length ? auth.slides : SITE_DEFAULTS.auth.slides).map((sl, i) => ({ ...sl, key: `${i}-${sl.key || sl.label || ''}` }));
  const count = SLIDES.length;
  const [picked, setIndex] = useState(0);
  const index = Math.min(picked, count - 1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [reduced, setReduced] = useState(null); // null = belum diketahui (SSR)
  const [visible, setVisible] = useState(false);
  const rootRef = useRef(null);
  const videoRefs = useRef([]);

  // prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Hanya berjalan saat panel benar-benar terlihat (di < lg panel disembunyikan).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const slide = SLIDES[index];
  const autoplay = reduced === false && visible;
  const paused = hovered || focused || userPaused;
  const running = autoplay && !paused;

  const next = useCallback(() => setIndex((i) => (Math.min(i, count - 1) + 1) % count), [count]);

  // Video: putar hanya saat slide-nya aktif & berjalan; mulai dari bab yang ditentukan.
  useEffect(() => {
    videoRefs.current.forEach((el, i) => i !== index && el?.pause());
    const v = videoRefs.current[index];
    if (!v) return;
    if (!slide.video || !autoplay) {
      v.pause();
      return;
    }
    try {
      v.currentTime = slide.start || 0;
    } catch {
      /* metadata belum siap */
    }
  }, [slide.key, slide.video, slide.start, autoplay, index]);

  useEffect(() => {
    const v = videoRefs.current[index];
    if (!v || !slide.video || !autoplay) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [slide.key, slide.video, autoplay, paused, index]);

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label={`Sorotan fitur ${brand.name}`}
      className={cn('relative isolate h-full overflow-hidden rounded-[24px] bg-[#0B1640] text-white', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={(e) => {
        // Jeda hanya untuk fokus keyboard (klik mouse sudah ditangani oleh hover).
        if (e.target.matches?.(':focus-visible')) setFocused(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      {/* Media (cross-fade) */}
      {SLIDES.map((sl, i) => {
        const active = i === index;
        return (
          <div
            key={sl.key}
            aria-hidden
            className={cn('absolute inset-0 transition-opacity duration-700 ease-out', active ? 'opacity-100' : 'opacity-0')}
          >
            {sl.video || sl.framed ? (
              <FramedMedia
                slide={sl}
                active={active}
                animate={active && autoplay}
                domain={domain}
                videoRef={(el) => {
                  videoRefs.current[i] = el;
                }}
              />
            ) : (
              <img
                src={sl.image}
                alt=""
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={cn('absolute inset-0 h-full w-full object-cover', active && autoplay && s.zoom)}
              />
            )}
          </div>
        );
      })}

      {/* Gradien gelap bawah agar teks putih terbaca */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-[#0B1640] via-[#0B1640]/80 to-transparent" aria-hidden />

      {/* Teks + tab */}
      <div className="absolute inset-x-0 bottom-0 p-8 xl:p-10">
        <div aria-live={running ? 'off' : 'polite'} aria-atomic="true">
          <p key={slide.key} className="animate-fade-up text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-white xl:text-[36px]">
            {slide.title}
          </p>
          <p key={`${slide.key}-sub`} className="mt-2 animate-fade-up text-[15px] text-white/75 [animation-delay:60ms]">
            {slide.subtitle}
          </p>
        </div>

        <div className="mt-8 flex items-end gap-3">
          <div className="flex flex-1 items-end gap-3">
            {SLIDES.map((sl, i) => {
              const active = i === index;
              return (
                <button
                  key={sl.key}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-current={active ? 'true' : undefined}
                  aria-label={`Slide ${i + 1} dari ${SLIDES.length}: ${sl.label}`}
                  className="group w-full max-w-[96px] rounded-md pt-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-obsidian"
                >
                  <span className={cn('block text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors', active ? 'text-white' : 'text-white/60 group-hover:text-white/90')}>
                    {sl.label}
                  </span>
                  <span className="mt-2.5 block h-[3px] overflow-hidden rounded-full bg-white/20">
                    {active && reduced !== null && (
                      <span
                        key={`${sl.key}-${index}`}
                        className={cn('block h-full rounded-full bg-white', autoplay ? s.fill : s.fillDone)}
                        style={{ '--dur': `${sl.duration || DEFAULT_DURATION}ms`, animationPlayState: running ? 'running' : 'paused' }}
                        onAnimationEnd={autoplay ? next : undefined}
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {reduced === false && (
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? 'Putar slide otomatis' : 'Jeda slide otomatis'}
              aria-pressed={userPaused}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {userPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default AuthVisual;

/**
 * Slide "berbingkai": latar gradasi biru + jendela browser berisi screenshot/video aplikasi + maskot.
 * slide: { image | video, poster, mascot } · domain: teks alamat di bilah browser.
 */
function FramedMedia({ slide, active, animate, domain, videoRef }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#3765F6] via-[#1F3FB0] to-[#0B1640]">
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(180deg,#000,transparent_75%)]" />
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-mint/20 blur-3xl" />

      <div
        className={cn(
          'absolute inset-x-[7%] top-[11%] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_80px_-20px_rgba(5,12,40,.65)] ring-1 ring-white/30 transition-transform duration-[1200ms] ease-out',
          animate ? 'translate-y-0' : 'translate-y-3',
        )}
      >
        <div className="flex h-8 items-center gap-3 border-b border-mist-100 bg-ghost px-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </span>
          <span className="mx-auto flex h-5 min-w-0 max-w-[60%] flex-1 items-center justify-center rounded-md bg-white px-3 text-[11px] font-medium text-mist-700 ring-1 ring-inset ring-mist-100">
            <span className="truncate">{domain}</span>
          </span>
          <span className="w-[42px]" aria-hidden />
        </div>
        {slide.video ? (
          <video ref={videoRef} className="block aspect-[16/10] w-full bg-ghost object-cover object-top" src={slide.video} poster={slide.poster} muted loop playsInline preload="none" tabIndex={-1} />
        ) : (
          <img src={slide.image} alt="" loading={active ? 'eager' : 'lazy'} decoding="async" className="block aspect-[16/10] w-full bg-ghost object-cover object-top" />
        )}
      </div>

      {slide.mascot && (
        <img
          src={slide.mascot}
          alt=""
          className={cn(
            'mascot-float absolute right-[3%] top-[46%] w-[21%] max-w-[180px] drop-shadow-[0_18px_24px_rgba(5,12,40,.45)] transition-all duration-700 ease-out',
            active ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0',
          )}
        />
      )}
    </div>
  );
}

