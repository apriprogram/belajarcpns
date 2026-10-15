import { cn } from '@/lib/cn';

/**
 * Baris filter: slot kiri (search + filter/segmented) dan slot kanan (aksi: Filter, Ekspor, Tambah).
 * search · filters (node setelah search) · actions (kanan) · children (tambahan di kiri)
 * Di mobile menumpuk vertikal; di ≥ md sejajar.
 */
export function FilterBar({ search, filters, actions, children, className }) {
  return (
    <div className={cn('flex flex-col gap-3 md:flex-row md:items-center md:justify-between', className)}>
      {(search || filters || children) && (
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          {search && <div className="w-full sm:w-72 sm:max-w-full">{search}</div>}
          {filters}
          {children}
        </div>
      )}
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">{actions}</div>}
    </div>
  );
}

export default FilterBar;
