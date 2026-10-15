import { cn } from '@/lib/cn';

const SIZES = { xs: 'h-3.5 w-3.5 border-[1.5px]', sm: 'h-4 w-4 border-2', md: 'h-5 w-5 border-2', lg: 'h-8 w-8 border-[3px]', xl: 'h-10 w-10 border-[3px]' };

/** Spinner bulat. tone: 'current' (ikut warna teks) | 'cobalt' | 'white' */
export function Spinner({ size = 'md', tone = 'current', className, label = 'Memuat' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full border-solid',
        SIZES[size] || SIZES.md,
        tone === 'cobalt' && 'border-cobalt/20 border-t-cobalt',
        tone === 'white' && 'border-white/30 border-t-white',
        tone === 'current' && 'border-current border-r-transparent border-b-transparent opacity-80',
        className,
      )}
    />
  );
}

/** Blok pemuatan terpusat untuk area konten/kartu. */
export function LoadingBlock({ label = 'Memuat data…', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-sm text-mist-700', className)}>
      <Spinner size="lg" tone="cobalt" />
      <span>{label}</span>
    </div>
  );
}

export default Spinner;
