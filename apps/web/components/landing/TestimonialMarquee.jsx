'use client';

/* eslint-disable @next/next/no-img-element -- avatar unggahan peserta (URL dinamis) */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, MessageSquareQuote, PenLine, Quote, Star } from 'lucide-react';
import { Button, IconButton, Modal, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatRelatif, initials } from '@/lib/format';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSite } from '@/components/providers/SiteProvider';
import { Reveal } from './Motion';
import { useInitialTestimonials } from './TestimonialsContext';

/*
 * Section "Testimoni" (docs/TESTIMONI.md): data publik GET /api/testimonials.
 * Marquee berbasis scrollLeft (bukan animasi CSS) supaya bisa digeser manual — scroll horizontal,
 * trackpad, sentuh, drag mouse, panah keyboard, dan tombol ‹ › — sambil tetap berputar tanpa ujung.
 */

const SPEED = 30; // px per detik
const RESUME_AFTER = 1800; // ms jeda setelah interaksi manual sebelum berjalan lagi
const MIN_ANIMATED = 3; // < 3 item → baris statis (tanpa marquee)
const TWO_ROWS = 6; // ≥ 6 item → 2 baris berlawanan arah

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const easeOut = (t) => 1 - (1 - t) ** 3;
const nf = (v, digits = 0) => Number(v || 0).toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Normalisasi payload { items, average, total } dari API/SSR → state siap pakai. */
function normalize(data) {
  const items = (Array.isArray(data?.items) ? data.items : []).filter((t) => t && typeof t.content === 'string' && t.content.trim());
  const sum = items.reduce((a, t) => a + (Number(t.rating) || 0), 0);
  return {
    status: 'ready',
    items,
    total: Number(data?.total) || items.length,
    average: Number(data?.average) || (items.length ? sum / items.length : 0),
  };
}

const sameData = (a, b) => a.status === b.status && a.total === b.total && a.average === b.average && JSON.stringify(a.items) === JSON.stringify(b.items);

/**
 * Testimoni publik. Data awal dari server (TestimonialsProvider, SSR) dipakai langsung bila ada;
 * lalu tetap diambil ulang di klien (GET /api/testimonials) untuk data terbaru.
 * Endpoint gagal → pakai data SSR bila ada, selain itu dianggap kosong (section tetap tampil).
 */
function useTestimonials() {
  const initial = useInitialTestimonials();
  const [state, setState] = useState(() => {
    const seeded = initial ? normalize(initial) : null;
    return seeded && seeded.items.length ? seeded : { status: 'loading', items: [], average: 0, total: 0 };
  });
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch('/api/testimonials', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        if (body && body.success === false) throw new Error('gagal');
        const next = normalize(body && typeof body === 'object' && 'data' in body ? body.data : body);
        setState((prev) => (sameData(prev, next) ? prev : next));
      } catch (err) {
        if (err?.name === 'AbortError') return;
        setState((prev) => (prev.status === 'ready' && prev.items.length ? prev : { status: 'error', items: [], average: 0, total: 0 }));
      }
    })();
    return () => ctrl.abort();
  }, []);
  return state;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */

export function TestimonialMarquee({ className }) {
  const { status, items, average, total } = useTestimonials();
  const reduced = useReducedMotion();
  const rows = useMemo(
    () => (items.length >= TWO_ROWS ? [items.filter((_, i) => i % 2 === 0), items.filter((_, i) => i % 2 === 1)] : [items]),
    [items],
  );
  const animated = items.length >= MIN_ANIMATED;
  const controls = useRef([]);
  // Status jeda bersama (hover / fokus di area testimoni) dibaca tiap frame oleh baris marquee.
  const shared = useRef({ hover: false, focus: false, modal: false });
  const [selected, setSelected] = useState(null);
  const open = useCallback((t) => {
    shared.current.modal = true;
    setSelected(t);
  }, []);
  const close = useCallback(() => {
    shared.current.modal = false;
    setSelected(null);
  }, []);

  const nudge = useCallback((dir) => controls.current.forEach((c) => c?.nudge(dir)), []);
  const register = useCallback((i, c) => {
    controls.current[i] = c;
  }, []);

  if (status === 'loading') return <LoadingRow className={className} />;
  if (!items.length) return <EmptyInvite className={className} />;

  return (
    <div
      className={className}
      onPointerEnter={(e) => {
        if (e.pointerType === 'mouse') shared.current.hover = true;
      }}
      onPointerLeave={() => {
        shared.current.hover = false;
      }}
      onFocus={(e) => {
        // Jeda hanya untuk fokus keyboard; klik/drag mouse tidak membuat marquee berhenti permanen.
        let kb = true;
        try {
          kb = e.target.matches(':focus-visible');
        } catch {}
        shared.current.focus = kb;
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) shared.current.focus = false;
      }}
    >
      <Reveal className="container-wide flex flex-wrap items-center justify-between gap-3">
        <Summary items={items} average={average} total={total} />
        <div className="flex items-center gap-2">
          <WriteLink />
          {animated && (
            <>
              <IconButton icon={<ChevronLeft />} label="Testimoni sebelumnya" onClick={() => nudge(-1)} className="ring-1 ring-inset ring-mist-100" />
              <IconButton icon={<ChevronRight />} label="Testimoni berikutnya" onClick={() => nudge(1)} className="ring-1 ring-inset ring-mist-100" />
            </>
          )}
        </div>
      </Reveal>

      <Reveal variant="fade" delay={150} className="mt-6 space-y-4 sm:space-y-5 xl:mt-8">
        {animated ? (
          rows.map((row, i) => (
            <MarqueeRow
              key={`${i}-${row.length}`}
              index={i}
              items={row}
              direction={i % 2 === 0 ? 1 : -1}
              reduced={reduced}
              shared={shared}
              register={register}
              onOpen={open}
              label={rows.length > 1 ? `Testimoni peserta, baris ${i + 1}` : 'Testimoni peserta'}
            />
          ))
        ) : (
          <ul className="container-wide flex flex-wrap justify-center gap-4 sm:gap-5" aria-label="Testimoni peserta">
            {items.map((t, i) => (
              <li key={t.id ?? i} className="w-full max-w-[400px] sm:w-[380px]">
                <TestimonialCard t={t} onOpen={open} />
              </li>
            ))}
          </ul>
        )}
      </Reveal>
      <TestimonialModal t={selected} onClose={close} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Satu baris marquee. Isi diulang beberapa salinan; posisi (scrollLeft) dijaga di tengah salinan
 * dan "dilompatkan" tepat satu lebar salinan saat mendekati ujung → putaran mulus tanpa batas.
 */
function MarqueeRow({ index, items, direction, reduced, shared, register, label, onOpen }) {
  const scrollerRef = useRef(null);
  const copyRef = useRef(null);
  const [copies, setCopies] = useState(3);
  const st = useRef({ pos: 0, W: 0, step: 0, lastSet: -1, userUntil: 0, drag: null, touch: false, tween: null, reduced: false });

  useEffect(() => {
    st.current.reduced = reduced;
  }, [reduced]);

  // Lompat satu salinan bila terlalu dekat ke ujung kiri/kanan area gulir.
  const wrap = useCallback((p) => {
    const s = st.current;
    const el = scrollerRef.current;
    if (!s.W || !el) return p;
    const max = el.scrollWidth - el.clientWidth;
    if (p < s.W * 0.5) return p + s.W;
    if (p > max - s.W * 0.5) return p - s.W;
    return p;
  }, []);

  const apply = useCallback(
    (doWrap = true) => {
      const s = st.current;
      const el = scrollerRef.current;
      if (!el || !s.W) return;
      if (doWrap) s.pos = wrap(s.pos);
      el.scrollLeft = s.pos;
      s.lastSet = el.scrollLeft;
    },
    [wrap],
  );

  // Ukur lebar satu salinan & tentukan jumlah salinan yang cukup untuk menutup layar.
  useIsoLayoutEffect(() => {
    const el = scrollerRef.current;
    const copy = copyRef.current;
    if (!el || !copy) return undefined;
    const measure = () => {
      const s = st.current;
      const W = copy.getBoundingClientRect().width;
      if (!W) return;
      const phase = s.W ? (((s.pos - s.W) % s.W) + s.W) % s.W / s.W : 0;
      s.W = W;
      s.step = W / Math.max(1, items.length);
      s.pos = W + phase * W;
      const need = 3 + Math.ceil(el.clientWidth / W);
      setCopies((c) => (c === need ? c : need));
      apply(false);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    ro?.observe(copy);
    return () => ro?.disconnect();
  }, [items.length, apply]);

  // Jumlah salinan berubah → pastikan posisi tetap valid.
  useIsoLayoutEffect(() => {
    apply(false);
  }, [copies, apply]);

  // Loop animasi: hanya berjalan saat baris terlihat.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    const s = st.current;
    let raf = 0;
    let last = 0;
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      if (!s.W || s.drag) return;
      if (s.tween) {
        const t = Math.min(1, (now - s.tween.t0) / s.tween.dur);
        s.pos = s.tween.from + (s.tween.to - s.tween.from) * easeOut(t);
        if (t >= 1) s.tween = null;
        apply(!s.tween);
        return;
      }
      const sh = shared.current;
      if (s.reduced || sh.hover || sh.focus || sh.modal || s.touch || now < s.userUntil || document.hidden) return;
      s.pos += (direction * SPEED * dt) / 1000;
      apply();
    };
    const start = () => {
      if (!raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    let io = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: '120px 0px' });
      io.observe(el);
    } else start();
    return () => {
      io?.disconnect();
      stop();
    };
  }, [direction, shared, apply]);

  // Gulir manual (wheel/trackpad horizontal, sentuh, keyboard): ikuti posisi pengguna lalu jeda sebentar.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return undefined;
    const s = st.current;
    const onScroll = () => {
      if (s.drag || Math.abs(el.scrollLeft - s.lastSet) <= 1.5) return;
      s.tween = null;
      s.userUntil = performance.now() + RESUME_AFTER;
      s.pos = el.scrollLeft;
      const w = wrap(s.pos);
      if (w !== s.pos) {
        s.pos = w;
        el.scrollLeft = w;
      }
      s.lastSet = el.scrollLeft;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [wrap]);

  // Tombol ‹ › : geser satu kartu (rata ke tepi kartu).
  useEffect(() => {
    register(index, {
      nudge: (dir) => {
        const s = st.current;
        const el = scrollerRef.current;
        if (!el || !s.W || !s.step) return;
        const base = s.tween ? s.tween.to : s.pos;
        let to = (Math.round(base / s.step) + dir) * s.step;
        let from = s.pos;
        const max = el.scrollWidth - el.clientWidth;
        if (to < s.W * 0.5) {
          to += s.W;
          from += s.W;
        } else if (to > max - s.W * 0.5) {
          to -= s.W;
          from -= s.W;
        }
        s.userUntil = performance.now() + RESUME_AFTER;
        if (s.reduced) {
          s.tween = null;
          s.pos = to;
          apply();
          return;
        }
        s.tween = { from, to, t0: performance.now(), dur: 560 };
      },
    });
    return () => register(index, null);
  }, [index, register, apply]);

  // Drag dengan mouse (sentuh memakai gulir bawaan browser).
  const onPointerDown = (e) => {
    const s = st.current;
    if (e.pointerType !== 'mouse') {
      s.touch = true;
      return;
    }
    if (e.button !== 0) return;
    s.tween = null;
    s.drag = { x: e.clientX, pos: s.pos };
    s.moved = false;
  };
  const onPointerMove = (e) => {
    const s = st.current;
    if (!s.drag) return;
    if (!s.moved && Math.abs(e.clientX - s.drag.x) > 5) {
      // Baru dianggap drag setelah bergeser > 5px — klik biasa tetap sampai ke kartu.
      s.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      e.currentTarget.dataset.dragging = 'true';
    }
    if (!s.moved) return;
    const raw = s.drag.pos - (e.clientX - s.drag.x);
    const w = wrap(raw);
    if (w !== raw) s.drag.pos += w - raw;
    s.pos = w;
    apply(false);
  };
  const endPointer = (e) => {
    const s = st.current;
    s.touch = false;
    if (!s.drag) return;
    s.drag = null;
    s.userUntil = performance.now() + RESUME_AFTER;
    delete e.currentTarget.dataset.dragging;
  };

  return (
    <div
      ref={scrollerRef}
      role="region"
      aria-label={label}
      aria-roledescription="carousel"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        // Klik setelah drag mouse bukan klik kartu.
        if (st.current.moved) {
          e.preventDefault();
          e.stopPropagation();
          st.current.moved = false;
        }
      }}
      className={cn(
        'flex cursor-grab overflow-x-auto overflow-y-hidden py-1 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt',
        'data-[dragging=true]:cursor-grabbing data-[dragging=true]:select-none',
        '[mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]',
      )}
    >
      {Array.from({ length: copies }).map((_, c) => (
        <ul
          key={c}
          ref={c === 0 ? copyRef : undefined}
          aria-hidden={c === 0 ? undefined : true}
          className="flex w-max shrink-0 items-stretch gap-4 pr-4 sm:gap-5 sm:pr-5"
        >
          {items.map((t, i) => (
            <li key={`${c}-${t.id ?? i}`} className="w-[290px] shrink-0 sm:w-[360px]">
              <TestimonialCard t={t} onOpen={onOpen} hidden={c !== 0} />
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Stars({ rating, className, size = 'h-4 w-4', decorative }) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': `Rating ${r} dari 5` };
  return (
    <span className={cn('flex items-center gap-0.5', className)} {...a11y}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} aria-hidden strokeWidth={0} className={cn(size, i < r ? 'fill-warning' : 'fill-mist-100')} />
      ))}
    </span>
  );
}

function PersonAvatar({ user, className }) {
  const name = user?.name || 'Peserta';
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt="" loading="lazy" draggable={false} className={cn('h-10 w-10 shrink-0 rounded-full bg-cobalt-50 object-cover', className)} />;
  }
  return (
    <span aria-hidden className={cn('flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-cobalt-50 text-[13px] font-semibold text-cobalt-700', className)}>
      {initials(name)}
    </span>
  );
}

function TestimonialCard({ t, onOpen, hidden }) {
  const name = t.user?.name || 'Peserta';
  return (
    <figure
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen && !hidden ? 0 : undefined}
      aria-label={onOpen ? `Baca testimoni lengkap dari ${name}` : undefined}
      onClick={onOpen ? () => onOpen(t) : undefined}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen(t);
              }
            }
          : undefined
      }
      className={cn(
        'flex h-full min-h-[212px] flex-col rounded-[20px] bg-white p-5 ring-1 ring-inset ring-mist-100 sm:min-h-[228px] sm:p-6',
        onOpen && 'cursor-pointer transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:ring-cobalt-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Stars rating={t.rating} />
        <Quote aria-hidden className="h-5 w-5 fill-mist-100 text-mist-100" />
      </div>
      <blockquote className="mt-3.5 line-clamp-5 whitespace-pre-line break-words text-sm leading-relaxed text-obsidian-600 sm:text-[15px]">{t.content}</blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-5">
        <PersonAvatar user={t.user} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-obsidian">{name}</span>
          {t.published_at && (
            <span className="block text-xs text-mist-700" suppressHydrationWarning>
              {formatRelatif(t.published_at)}
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

/** Modal baca testimoni lengkap (latar gelap tanpa blur). */
function TestimonialModal({ t, onClose }) {
  const [last, setLast] = useState(t);
  if (t && t !== last) setLast(t);
  const v = t || last;
  const name = v?.user?.name || 'Peserta';
  return (
    <Modal open={!!t} onClose={onClose} size="md" blur={false} title="Testimoni peserta" divider={false}>
      {v && (
        <div className="pb-1">
          <div className="flex items-center justify-between gap-3">
            <Stars rating={v.rating} size="h-5 w-5" />
            <Quote aria-hidden className="h-7 w-7 fill-cobalt-50 text-cobalt-50" />
          </div>
          <p className="mt-4 whitespace-pre-line break-words text-[16px] leading-relaxed text-obsidian">{v.content}</p>
          <div className="mt-6 flex items-center gap-3 border-t border-mist-100 pt-5">
            <PersonAvatar user={v.user} className="h-11 w-11" />
            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold text-obsidian">{name}</span>
              <span className="block text-[13px] text-mist-700">Peserta{v.published_at ? ` · ${formatRelatif(v.published_at)}` : ''}</span>
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
}

/** Chip ringkasan: tumpukan avatar + rata-rata ★ + jumlah ulasan. */
function Summary({ items, average, total }) {
  const faces = items.slice(0, 4);
  return (
    <div className="inline-flex h-11 items-center gap-3 rounded-full bg-white pl-1.5 pr-4 ring-1 ring-inset ring-mist-100">
      <span className="flex -space-x-2" aria-hidden>
        {faces.map((t, i) => (
          <PersonAvatar key={t.id ?? i} user={t.user} className="h-8 w-8 text-[11px] ring-2 ring-white" />
        ))}
      </span>
      <span className="flex items-center gap-1.5 text-[15px] font-semibold tabular-nums text-obsidian" suppressHydrationWarning>
        <Star aria-hidden strokeWidth={0} className="h-4 w-4 fill-warning" />
        {nf(average, 1)}
      </span>
      <span className="text-sm text-mist-700" suppressHydrationWarning>
        dari {nf(total)} ulasan
      </span>
    </div>
  );
}

/** Ajakan menulis testimoni sesuai status login. */
function WriteLink() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return (
      <Button shape="pill" size="sm" variant="secondary" href="/admin/testimoni" className="hidden sm:inline-flex">
        Kelola testimoni
      </Button>
    );
  }
  return (
    <Button shape="pill" size="sm" variant="secondary" icon={<PenLine />} href={user ? '/testimoni' : '/login?next=/testimoni'} className="hidden sm:inline-flex">
      {user ? 'Tulis testimoni' : 'Bagikan cerita'}
    </Button>
  );
}

/** Belum ada testimoni (atau endpoint belum tersedia) → ajakan menjadi yang pertama. */
function EmptyInvite({ className }) {
  const { user } = useAuth();
  const { brand } = useSite();
  return (
    <div className={cn('container-wide', className)}>
      <Reveal variant="scale">
        <div className="card-flat relative mx-auto flex max-w-2xl flex-col items-center overflow-hidden px-5 py-10 text-center sm:px-12 sm:py-14">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cobalt-50 text-cobalt">
            <MessageSquareQuote className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </span>
          <Stars rating={0} decorative className="mt-5" />
          <h3 className="mt-4 text-xl font-semibold leading-tight tracking-[-0.025em] sm:text-[28px] sm:leading-8">Jadilah yang pertama berbagi cerita</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-mist-700 sm:text-[15px]">
            Sudah berlatih atau ikut tryout di {brand.name}? Ceritakan pengalaman Anda — testimoni terpilih akan tampil di sini dan membantu peserta lain.
          </p>
          <div className="mt-8 flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row">
            {user ? (
              <Button shape="pill" href={user.role === 'admin' ? '/admin/testimoni' : '/testimoni'} iconRight={<ArrowRight />}>
                {user.role === 'admin' ? 'Kelola testimoni' : 'Tulis testimoni'}
              </Button>
            ) : (
              <>
                <Button shape="pill" variant="secondary" href="/login?next=/testimoni">
                  Masuk
                </Button>
                <Button shape="pill" href="/daftar" iconRight={<ArrowRight />}>
                  Daftar
                </Button>
              </>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function LoadingRow({ className }) {
  return (
    <div className={className} aria-busy="true">
      <div className="container-wide">
        <Skeleton className="h-11 w-64" rounded="rounded-full" />
      </div>
      <div className="mt-6 flex gap-4 overflow-hidden pl-5 sm:gap-5 sm:pl-8 lg:pl-12 xl:mt-8" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex h-[228px] w-[290px] shrink-0 flex-col rounded-[20px] bg-white p-6 ring-1 ring-inset ring-mist-100 sm:w-[360px]">
            <Skeleton className="h-4 w-24" rounded="rounded-md" />
            <Skeleton className="mt-5 h-3.5 w-full" rounded="rounded-md" />
            <Skeleton className="mt-2.5 h-3.5 w-11/12" rounded="rounded-md" />
            <Skeleton className="mt-2.5 h-3.5 w-3/5" rounded="rounded-md" />
            <div className="mt-auto flex items-center gap-3">
              <Skeleton className="h-10 w-10" rounded="rounded-full" />
              <Skeleton className="h-3.5 w-28" rounded="rounded-md" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Memuat testimoni…</span>
    </div>
  );
}

export default TestimonialMarquee;
