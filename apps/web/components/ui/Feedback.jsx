import { AlertCircle, Inbox, RotateCw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { renderIcon } from './_icon';

/**
 * Status kosong (Style UI v2): ikon dalam kotak bg-ghost, judul, deskripsi, aksi.
 * icon · title · description · action (elemen, mis. <Button>) · secondaryAction (mis. tautan) · size: 'md' | 'sm'
 * variant: 'plain' (tanpa latar) | 'card' (kartu putih bergaris) | 'dashed' (bingkai putus-putus)
 */
export function EmptyState({ icon, title = 'Belum ada data', description, action, secondaryAction, size = 'md', variant = 'plain', className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'sm' ? 'px-4 py-8' : 'px-6 py-14',
        variant === 'card' && 'rounded-[20px] bg-white ring-1 ring-inset ring-mist-100',
        variant === 'dashed' && 'rounded-[20px] border-2 border-dashed border-mist-100',
        className,
      )}
    >
      <span className={cn('mb-4 flex items-center justify-center rounded-xl text-obsidian-600', variant === 'dashed' ? 'bg-white ring-1 ring-inset ring-mist-100' : 'bg-ghost', size === 'sm' ? 'h-10 w-10' : 'h-12 w-12')}>
        {renderIcon(icon || <Inbox />, size === 'sm' ? 'h-[18px] w-[18px]' : 'h-5 w-5')}
      </span>
      <h3 className={cn('font-semibold tracking-tight', size === 'sm' ? 'text-[15px]' : 'text-lg')}>{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-mist-700">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

/** Status error dengan tombol "Coba lagi". error: ApiError/Error/string · onRetry */
export function ErrorState({ error, title = 'Gagal memuat data', onRetry, size = 'md', variant = 'plain', className }) {
  const message = typeof error === 'string' ? error : error?.message;
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'sm' ? 'px-4 py-8' : 'px-6 py-14',
        variant === 'card' && 'rounded-[20px] bg-white ring-1 ring-inset ring-mist-100',
        className,
      )}
    >
      <span className={cn('mb-4 flex items-center justify-center rounded-xl bg-danger-50 text-danger', size === 'sm' ? 'h-10 w-10' : 'h-12 w-12')}>
        <AlertCircle className={size === 'sm' ? 'h-[18px] w-[18px]' : 'h-5 w-5'} />
      </span>
      <h3 className={cn('font-semibold tracking-tight', size === 'sm' ? 'text-[15px]' : 'text-lg')}>{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm leading-relaxed text-mist-700">{message}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" icon={<RotateCw />} onClick={onRetry} className="mt-5">
          Coba lagi
        </Button>
      )}
    </div>
  );
}

/** Blok skeleton. Atur ukuran via className (mis. "h-6 w-40"). rounded default xl. */
export function Skeleton({ className, rounded = 'rounded-xl', ...props }) {
  return <span aria-hidden className={cn('block animate-pulse bg-mist-100', rounded, className)} {...props} />;
}

/** Beberapa baris teks skeleton. */
export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2.5', className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3.5" rounded="rounded-md" style={{ width: i === lines - 1 ? '60%' : `${92 - i * 6}%` }} />
      ))}
    </div>
  );
}

/** Kartu skeleton standar (judul + teks + blok). */
export function SkeletonCard({ className, height = 'h-28' }) {
  return (
    <div className={cn('rounded-[20px] bg-white p-5 ring-1 ring-inset ring-mist-100 sm:p-6', className)} aria-busy="true" aria-label="Memuat">
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="h-9 w-9" rounded="rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" rounded="rounded-md" />
          <Skeleton className="h-3 w-1/2" rounded="rounded-md" />
        </div>
      </div>
      <Skeleton className={cn('w-full', height)} rounded="rounded-xl" />
    </div>
  );
}
