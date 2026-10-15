'use client';

import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';
import { LogoMark } from './Logo';

/** Nama website dengan karakter aksen (kemunculan pertama) berwarna cobalt. */
function BrandWord({ name, accent }) {
  const i = accent ? name.indexOf(accent) : -1;
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <span className="text-cobalt">{accent}</span>
      {name.slice(i + accent.length)}
    </>
  );
}

/**
 * Layar memuat bermerek: logo dalam cincin cobalt yang berputar pelan, nama website,
 * dan bar progres tak tentu. Muncul setelah jeda singkat agar tidak berkedip pada muatan cepat.
 * Animasi CSS di globals.css (.page-loader*) — mati otomatis saat prefers-reduced-motion.
 * fullscreen=false → cukup mengisi area konten (mis. di dalam panel).
 */
export function PageLoader({ label = 'Memuat…', fullscreen = true, className }) {
  const { brand } = useSite();
  const name = brand?.name || 'BISA-PNS';
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('page-loader flex w-full items-center justify-center bg-ghost px-6', fullscreen ? 'min-h-[100svh]' : 'min-h-[60vh]', className)}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* halo lembut */}
          <span aria-hidden className="page-loader-pulse absolute inset-2 rounded-full bg-cobalt/10" />
          {/* cincin: track mist + busur cobalt */}
          <svg aria-hidden viewBox="0 0 96 96" className="page-loader-orbit absolute inset-0 h-full w-full">
            <circle cx="48" cy="48" r="44" fill="none" stroke="#E7ECF0" strokeWidth="3" />
            <circle cx="48" cy="48" r="44" fill="none" stroke="#3765F6" strokeWidth="3" strokeLinecap="round" strokeDasharray="70 207" />
          </svg>
          <span className="relative flex h-14 w-14 items-center justify-center rounded-[18px] bg-white ring-1 ring-inset ring-mist-100">
            <LogoMark className="h-10 w-10" />
          </span>
        </div>

        <p className="mt-6 text-[19px] font-bold tracking-[-0.03em] text-obsidian">
          <BrandWord name={name} accent={brand?.accent_char} />
        </p>

        <div aria-hidden className="mt-4 h-1 w-44 overflow-hidden rounded-full bg-mist-100">
          <span className="page-loader-bar block h-full w-2/5 rounded-full bg-cobalt" />
        </div>
        <p className="mt-3 text-sm font-medium text-mist-700">{label}</p>
      </div>
    </div>
  );
}

export default PageLoader;
