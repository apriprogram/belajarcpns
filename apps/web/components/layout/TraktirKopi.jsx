'use client';

/* eslint-disable @next/next/no-img-element -- gambar statis di /public */
import { useState } from 'react';
import { Check, Copy, Heart } from 'lucide-react';
import { Button, IconButton, Modal, useToast } from '@/components/ui';
import { BrandName } from './Logo';
import { cn } from '@/lib/cn';

const DANA_NUMBER = '082181361433';
const DANA_DISPLAY = '0821-8136-1433';

/**
 * Tombol hati "Traktir kopi" di navbar peserta → modal dukungan untuk developer via DANA.
 * Latar modal tidak di-blur.
 */
export function TraktirKopi({ className }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton
        icon={<Heart strokeWidth={1.75} className="transition-colors group-hover:fill-danger group-hover:text-danger" />}
        label="Traktir kopi developer"
        title="Traktir kopi developer"
        variant="white"
        onClick={() => setOpen(true)}
        className={cn('group !h-11 !w-11 !shadow-none', className)}
      />
      <TraktirKopiModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function TraktirKopiModal({ open, onClose }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(DANA_NUMBER).catch(() => legacyCopy(DANA_NUMBER));
      } else legacyCopy(DANA_NUMBER);
      setCopied(true);
      toast.success('Nomor DANA disalin', 'Tempel di aplikasi DANA → Kirim. Terima kasih! ☕');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Gagal menyalin', `Salin manual: ${DANA_NUMBER}`);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="md" blur={false} hideClose={false} divider={false} title="Traktir kopi developer" bodyClassName="!pt-0">
      {/* Ilustrasi: developer + gelembung pikiran "butuh kopi" */}
      <div className="relative -mx-1 overflow-hidden rounded-[20px] bg-gradient-to-br from-cobalt-50 via-white to-white ring-1 ring-inset ring-cobalt-100">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(#DCE5FE_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative flex items-end gap-2 px-4 pt-4 sm:px-6">
          <img src="/maskot/developer.webp" alt="Developer sedang ngoding" width={420} height={395} className="mascot-float -mb-2 h-auto w-[112px] shrink-0 drop-shadow-[0_12px_16px_rgba(31,63,176,0.18)] sm:w-[178px] min-[400px]:w-[132px]" />
          <div className="mb-8 min-w-0 flex-1">
            <div className="relative ml-1 inline-flex items-center gap-2.5 rounded-[22px] bg-white px-3 py-2.5 shadow-float ring-1 ring-mist-100 sm:ml-2 sm:gap-3 sm:px-4 sm:py-3">
              {/* ekor gelembung pikiran */}
              <span aria-hidden className="absolute -bottom-3 -left-1 h-3.5 w-3.5 rounded-full bg-white ring-1 ring-mist-100" />
              <span aria-hidden className="absolute -bottom-6 -left-4 h-2 w-2 rounded-full bg-white ring-1 ring-mist-100" />
              <CoffeeArt className="h-11 w-11 shrink-0 sm:h-14 sm:w-14" />
              <span className="whitespace-nowrap text-[13px] font-semibold leading-snug text-obsidian">
                Butuh kopi
                <br />
                <span className="font-medium text-mist-700">biar tetap ngoding ✨</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 text-[15px] leading-relaxed text-mist-700">
        Suka belajar di <span className="font-semibold text-obsidian"><BrandName /></span>? Traktir secangkir kopi untuk developer agar terus semangat menambah soal dan fitur baru. Berapa pun nominalnya sangat berarti 🙏
      </p>

      {/* Kartu DANA */}
      <div className="mt-5 flex flex-col gap-4 rounded-[20px] bg-white p-4 ring-1 ring-inset ring-mist-100 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#118EEA] text-[13px] font-extrabold tracking-wide text-white">DANA</span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-mist-700">Kirim ke DANA</p>
            <p className="font-mono text-xl font-semibold tabular-nums tracking-tight text-obsidian">{DANA_DISPLAY}</p>
          </div>
        </div>
        <Button variant={copied ? 'secondary' : 'accent'} icon={copied ? <Check /> : <Copy />} onClick={copy} className="sm:shrink-0">
          {copied ? 'Tersalin' : 'Salin nomor'}
        </Button>
      </div>

      <ol className="mt-4 grid gap-2 text-sm text-mist-700 sm:grid-cols-3">
        {['Buka aplikasi DANA', 'Pilih Kirim → ke nomor', 'Isi nominal seikhlasnya'].map((s, i) => (
          <li key={s} className="flex items-center gap-2 rounded-xl bg-ghost px-3 py-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cobalt text-[11px] font-semibold text-white">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[13px] text-mist-700">
          <Heart className="h-4 w-4 fill-danger text-danger" aria-hidden /> Terima kasih atas dukungannya!
        </p>
        <Button variant="secondary" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </Modal>
  );
}

/** Salin cadangan (browser tanpa izin Clipboard API). */
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand('copy');
  ta.remove();
  if (!ok) throw new Error('copy failed');
}

/** Cangkir kopi dengan uap mengepul (SVG). */
function CoffeeArt({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <g className="motion-safe:animate-[coffee-steam_2.4s_ease-in-out_infinite]" fill="none" stroke="#C3CED7" strokeWidth="2.6" strokeLinecap="round">
        <path d="M24 18c-3-4 3-6 0-10" />
        <path d="M32 18c-3-4 3-6 0-10" className="[animation-delay:.4s]" />
        <path d="M40 18c-3-4 3-6 0-10" />
      </g>
      <ellipse cx="32" cy="56" rx="20" ry="3.5" fill="#EEF2FF" />
      <path d="M46 30h3.5a6.5 6.5 0 0 1 0 13H45" fill="none" stroke="#3765F6" strokeWidth="3.4" />
      <path d="M14 24h32v16c0 8.8-7.2 16-16 16s-16-7.2-16-16V24z" fill="#3765F6" />
      <path d="M14 24h32v5H14z" fill="#2A52D6" />
      <ellipse cx="30" cy="24" rx="16" ry="3" fill="#6B3E26" />
      <path d="M30 44.5l-4.6-4.3a2.8 2.8 0 0 1 4-4l.6.6.6-.6a2.8 2.8 0 0 1 4 4z" fill="#fff" />
    </svg>
  );
}

export default TraktirKopi;
