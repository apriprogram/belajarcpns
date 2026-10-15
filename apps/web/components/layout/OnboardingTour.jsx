'use client';

/* eslint-disable @next/next/no-img-element -- maskot statis di /public */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, PartyPopper, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSite } from '@/components/providers/SiteProvider';

/**
 * Tur pengenalan dashboard peserta (mode fokus/spotlight).
 * - Muncul otomatis untuk akun baru (dibuat ≤ NEW_USER_DAYS hari) yang belum pernah menyelesaikan/menutup tur.
 * - Bisa diputar ulang: window.dispatchEvent(new Event(TOUR_EVENT)) (dipakai menu profil "Tur dashboard").
 * - Target ditandai atribut data-tour="…"; langkah yang targetnya tidak terlihat (mis. menu desktop di HP) memakai
 *   target cadangan atau dilewati.
 * Status disimpan per pengguna di localStorage (bukan data penting — gagal simpan tetap aman).
 */
export const TOUR_EVENT = 'bisapns:tour';
const NEW_USER_DAYS = 7;

/** Putar tur: di /dashboard langsung, dari halaman lain pindah ke dashboard dulu. */
export function startTour(router) {
  const fire = () => window.dispatchEvent(new Event(TOUR_EVENT));
  if (window.location.pathname === '/dashboard') fire();
  else {
    router.push('/dashboard');
    setTimeout(fire, 1200);
  }
}
const keyFor = (id) => `bisapns:tour-done:${id}`;

const STEPS = [
  { id: 'welcome', center: true, mascot: '/maskot/dashboard.webp', title: (n) => `Selamat datang, ${n}! 👋`, body: (b) => `Yuk kenalan sebentar dengan fitur ${b}. Tur singkat ini hanya ±1 menit — kamu bisa menutupnya kapan saja.` },
  { id: 'latihan', targets: ['nav-latihan'], mascot: '/maskot/latihan.webp', title: 'Latihan soal', body: 'Belajar per materi TWK, TIU, dan TKP. Setiap soal langsung disertai pembahasan, jadi kamu tahu letak kesalahan.' },
  { id: 'tryout', targets: ['nav-tryout'], mascot: '/maskot/tryout.webp', title: 'Tryout CBT', body: 'Simulasi SKD 110 soal dalam 100 menit, mirip CAT BKN. Timer dihitung server dan jawaban tersimpan otomatis.' },
  { id: 'riwayat', targets: ['nav-riwayat'], mascot: '/maskot/riwayat.webp', title: 'Riwayat & hasil', body: 'Lihat skor per subtes, status lulus passing grade, peringkat, dan pembahasan setiap tryout yang sudah kamu kerjakan.' },
  { id: 'menu', targets: ['menu'], mobileOnly: true, mascot: '/maskot/latihan.webp', title: 'Menu utama', body: 'Buka menu ini untuk Latihan soal (per materi + pembahasan), Tryout CBT 110 soal/100 menit, dan Riwayat hasil ujianmu.' },
  { id: 'search', targets: ['search'], mascot: '/maskot/section-skd.webp', title: 'Cari cepat', body: 'Lompat ke halaman mana pun dengan cepat. Di komputer, tekan Ctrl K.' },
  { id: 'kopi', targets: ['kopi'], mascot: '/maskot/developer.webp', title: 'Traktir kopi developer ☕', body: 'Suka belajar di sini? Dukung developer lewat tombol hati ini agar soal dan fitur baru terus bertambah. Seikhlasnya saja!' },
  { id: 'tour', targets: ['tour-btn'], mascot: '/maskot/section-faq.webp', title: 'Putar ulang tutorial', body: 'Lupa fungsi sebuah fitur? Tekan tombol ini kapan saja untuk memutar tutorial ini lagi.' },
  { id: 'notif', targets: ['notif'], mascot: '/maskot/section-faq.webp', title: 'Pengumuman', body: 'Info terbaru dari admin — jadwal tryout akbar, paket baru, dan kabar penting lainnya — muncul di sini.' },
  { id: 'stats', targets: ['stats'], mascot: '/maskot/section-fitur.webp', title: 'Ringkasan belajarmu', body: 'Waktu belajar, rata-rata skor, tryout selesai, dan akurasi latihan diperbarui otomatis setiap kamu belajar.' },
  { id: 'kalender', targets: ['kalender'], mascot: '/maskot/section-langkah.webp', title: 'Kalender minggu ini', body: 'Jadwal tryout terdekat dan target harianmu tampil per hari, supaya belajar lebih teratur.' },
  { id: 'target', targets: ['target'], mascot: '/maskot/section-kontak.webp', title: 'Target harian', body: 'Tulis target kecil setiap hari (mis. "30 soal TIU") lalu centang saat selesai. Konsisten itu kunci!' },
  { id: 'chat', targets: ['groupchat'], mascot: '/maskot/section-testimoni.webp', title: 'Live GroupChat', body: 'Diskusi, berbagi tips, dan tanya jawab bersama peserta lain dan admin secara langsung.' },
  { id: 'profil', targets: ['profil'], mascot: '/maskot/profil.webp', title: 'Profil & testimoni', body: 'Atur data diri dan kata sandi, tulis testimoni, atau putar ulang tur ini dari menu profil.' },
  { id: 'done', center: true, final: true, mascot: '/maskot/section-cta.webp', title: (n) => `Hebat, ${n}! Tur selesai 🎉`, body: () => 'Kamu sudah siap. Mulai dari latihan soal dulu, lalu uji kemampuanmu lewat tryout. Semangat menuju kursi ASN!' },
];

const PAD = 8;

function visibleEl(name) {
  const els = document.querySelectorAll(`[data-tour="${name}"]`);
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') return el;
  }
  return null;
}

export function OnboardingTour() {
  const { user } = useAuth();
  const { brand } = useSite();
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [mounted, setMounted] = useState(false);
  const cardRef = useRef(null);
  const firstName = (user?.name || 'Peserta').trim().split(/\s+/)[0];

  useEffect(() => setMounted(true), []);

  // Mulai otomatis untuk akun baru
  useEffect(() => {
    if (!user || user.role !== 'peserta') return;
    let done = false;
    try {
      done = !!localStorage.getItem(keyFor(user.id));
    } catch {}
    const created = Date.parse(user.created_at || '');
    const isNew = Number.isFinite(created) && Date.now() - created < NEW_USER_DAYS * 864e5;
    if (!done && isNew) {
      const t = setTimeout(() => {
        setI(0);
        setOpen(true);
      }, 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [user]);

  // Putar ulang dari menu
  useEffect(() => {
    const start = () => {
      setI(0);
      setOpen(true);
    };
    window.addEventListener(TOUR_EVENT, start);
    return () => window.removeEventListener(TOUR_EVENT, start);
  }, []);

  const finish = useCallback(() => {
    setOpen(false);
    try {
      if (user?.id) localStorage.setItem(keyFor(user.id), new Date().toISOString());
    } catch {}
  }, [user]);

  // Langkah yang bisa ditampilkan (target terlihat), dihitung saat tur dibuka
  const [steps, setSteps] = useState(STEPS);
  useEffect(() => {
    if (!open) return;
    const desktopNav = !!visibleEl('nav-latihan');
    setSteps(STEPS.filter((s) => s.center || (s.mobileOnly ? !desktopNav : s.targets.some((t) => visibleEl(t)))));
  }, [open]);

  const step = steps[Math.min(i, steps.length - 1)];
  const target = useMemo(() => (open && step && !step.center ? step.targets.map(visibleEl).find(Boolean) : null), [open, step]);

  // Ukur & gulir target
  useLayoutEffect(() => {
    if (!open) return undefined;
    if (!target) {
      setRect(null);
      return undefined;
    }
    const r0 = target.getBoundingClientRect();
    const fixed = getComputedStyle(target).position === 'fixed' || target.closest('header');
    const phone = window.innerWidth < 640;
    if (!fixed && (r0.top < 90 || r0.bottom > window.innerHeight - (phone ? 300 : 40))) {
      // Di HP kartu penjelasan menempel di bawah → letakkan target di bagian atas layar.
      if (phone) window.scrollTo({ top: window.scrollY + r0.top - 84, behavior: 'smooth' });
      else target.scrollIntoView({ block: r0.height > window.innerHeight * 0.6 ? 'start' : 'center', behavior: 'smooth' });
    }
    let raf = 0;
    const measure = () => {
      const r = target.getBoundingClientRect();
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [open, target]);

  // Keyboard
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') setI((x) => (x < steps.length - 1 ? x + 1 : x));
      else if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, steps.length, finish]);

  useEffect(() => {
    if (open) cardRef.current?.focus();
  }, [open, i]);

  if (!mounted || !open || !step) return null;

  const last = i >= steps.length - 1;
  const total = steps.length;
  const title = typeof step.title === 'function' ? step.title(firstName) : step.title;
  const body = typeof step.body === 'function' ? step.body(brand?.name || 'platform ini') : step.body;

  // Posisi kartu: di bawah target bila muat, selain itu di atas; di HP dibatasi tepi layar.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const cardW = Math.min(360, vw - 24);
  let cardStyle = { width: cardW };
  const phone = vw < 640;
  if (rect && !step.center && phone) {
    // Target di bagian bawah layar (mis. tombol GroupChat) → kartu di atas agar target tidak tertutup.
    const nearBottom = rect.top + rect.height > vh - 300;
    cardStyle = nearBottom ? { position: 'fixed', left: 12, right: 12, top: 12, width: 'auto' } : { position: 'fixed', left: 12, right: 12, bottom: 12, width: 'auto' };
  } else if (rect && !step.center) {
    const below = rect.top + rect.height + 14;
    const estH = 250;
    const top = below + estH < vh ? below : Math.max(12, rect.top - estH - 14);
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 12);
    cardStyle = { ...cardStyle, top, left, position: 'fixed' };
  }

  return createPortal(
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label={`Tur dashboard: ${title}`}>
      {/* Lapisan gelap + lubang sorot (box-shadow besar) */}
      {rect && !step.center ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-[18px] ring-2 ring-cobalt transition-all duration-300 ease-out"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: '0 0 0 9999px rgba(24,29,37,0.62)' }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-obsidian/60 animate-fade-in" />
      )}
      {/* Penangkap klik di luar (tidak menutup, agar tidak tak sengaja) */}
      <div className="fixed inset-0" aria-hidden />

      <div className={cn(step.center && 'fixed inset-0 flex items-center justify-center p-4')}>
        <div
          ref={cardRef}
          tabIndex={-1}
          key={step.id}
          style={step.center ? { width: Math.min(420, vw - 32) } : cardStyle}
          className="relative animate-fade-up overflow-hidden rounded-[22px] bg-white shadow-float ring-1 ring-mist-100 outline-none"
        >
          {step.final && <Confetti />}
          <button
            type="button"
            onClick={finish}
            aria-label="Tutup tur"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-mist-700 transition-colors hover:bg-ghost hover:text-obsidian"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>

          <div className={cn('flex gap-3 p-5 pr-12', step.center && 'flex-col items-center px-6 pb-5 pt-7 text-center')}>
            <img src={step.mascot} alt="" className={cn('mascot-float shrink-0 object-contain', step.center ? 'h-28 w-28' : 'h-16 w-16')} />
            <div className="min-w-0">
              {!step.center && <p className="font-mono text-[11px] font-semibold text-cobalt">{i} / {total - 2}</p>}
              <p className={cn('font-semibold tracking-tight text-obsidian', step.center ? 'text-xl' : 'mt-0.5 text-base')}>{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-mist-700">{body}</p>
            </div>
          </div>

          {/* Indikator langkah */}
          <div className="flex justify-center gap-1 pb-3" aria-hidden>
            {steps.map((s, k) => (
              <span key={s.id} className={cn('h-1.5 rounded-full transition-all', k === i ? 'w-5 bg-cobalt' : 'w-1.5 bg-mist-100')} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-mist-100 px-4 py-3">
            {step.final ? (
              <button type="button" onClick={finish} className="text-sm font-medium text-mist-700 hover:text-obsidian">
                Tutup
              </button>
            ) : (
              <button type="button" onClick={finish} className="text-sm font-medium text-mist-700 hover:text-obsidian">
                Lewati tur
              </button>
            )}
            <div className="flex items-center gap-2">
              {i > 0 && !step.final && (
                <button
                  type="button"
                  onClick={() => setI((x) => Math.max(0, x - 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-obsidian ring-1 ring-inset ring-mist-100 hover:bg-ghost"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Kembali
                </button>
              )}
              {step.final ? (
                <Link
                  href="/latihan"
                  onClick={finish}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cobalt px-4 text-sm font-semibold text-white hover:bg-cobalt-600"
                >
                  <PartyPopper className="h-4 w-4" aria-hidden /> Mulai latihan
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => (last ? finish() : setI((x) => x + 1))}
                  className="inline-flex h-9 items-center gap-1 rounded-full bg-cobalt px-4 text-sm font-semibold text-white hover:bg-cobalt-600"
                >
                  {i === 0 ? 'Mulai tur' : 'Lanjut'} <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Konfeti ringan (CSS) untuk langkah terakhir. */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, k) => ({
        left: (k * 37) % 100,
        delay: (k % 7) * 0.12,
        color: ['#3765F6', '#70FC8E', '#FF5AA5', '#F5B301'][k % 4],
        rot: (k * 47) % 360,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
      {pieces.map((p, k) => (
        <span
          key={k}
          className="tour-confetti absolute top-0 h-2.5 w-1.5 rounded-sm"
          style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, transform: `rotate(${p.rot}deg)` }}
        />
      ))}
    </div>
  );
}

export default OnboardingTour;
