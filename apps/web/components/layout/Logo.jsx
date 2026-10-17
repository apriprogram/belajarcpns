'use client';

/* eslint-disable @next/next/no-img-element -- logo unggahan admin (URL dinamis) */
import Link from 'next/link';
import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';

/** Tanda logo: gambar logo (bila diatur admin) atau kotak obsidian membulat dengan huruf + titik mint. */
export function LogoMark({ className, inverted }) {
  const { brand } = useSite();
  if (brand.logo_url) {
    return <img src={brand.logo_url} alt="" aria-hidden className={cn('relative inline-flex h-9 w-9 shrink-0 object-contain max-sm:h-8 max-sm:w-8', className)} />;
  }
  return (
    <span className={cn('relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] max-sm:h-8 max-sm:w-8 max-sm:rounded-[10px]', inverted ? 'bg-white text-obsidian' : 'bg-obsidian text-white', className)} aria-hidden>
      <span className="text-[17px] font-bold tracking-tighter">{brand.logo_letter || (brand.name || 'B').charAt(0)}</span>
      <span className="absolute right-[7px] top-[7px] h-[7px] w-[7px] rounded-full bg-mint" />
    </span>
  );
}

/** Nama website; karakter `accent_char` (kemunculan pertama) diwarnai. */
function BrandText({ name, accent, inverted }) {
  const i = accent ? name.indexOf(accent) : -1;
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <span className={inverted ? 'text-mint' : 'text-cobalt'}>{accent}</span>
      {name.slice(i + accent.length)}
    </>
  );
}

/**
 * Logo website. href (default "/") · inverted: untuk latar gelap · compact: hanya tanda
 */
export function Logo({ href = '/', inverted, compact, className, pill }) {
  const { brand } = useSite();
  const inner = (
    <>
      <LogoMark inverted={inverted} />
      {!compact && (
        <span className={cn('text-[17px] font-bold tracking-[-0.03em] max-sm:text-[15px]', inverted ? 'text-white' : 'text-obsidian')}>
          <BrandText name={brand.name} accent={brand.accent_char} inverted={inverted} />
        </span>
      )}
    </>
  );
  const cls = cn(
    'inline-flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/25',
    pill && 'h-12 bg-white pl-1.5 pr-4 shadow-soft ring-1 ring-inset ring-mist-100/70',
    className,
  );
  if (!href) return <span className={cls}>{inner}</span>;
  return (
    <Link href={href} className={cls} aria-label={`${brand.name} — beranda`}>
      {inner}
    </Link>
  );
}

/** Nama website dari pengaturan "Atur Website" (untuk teks biasa). */
export function BrandName() {
  return useSite().brand?.name || 'BISA-PNS';
}

/** Hook nama website. */
export function useBrandName() {
  return useSite().brand?.name || 'BISA-PNS';
}

export default Logo;
