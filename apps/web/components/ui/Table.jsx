import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Tabel Style UI v2: header abu (uppercase kecil), baris lega h-14, divider 1px mist-100, hover mist-50.
 *
 * <TableContainer maxHeight={480} bordered>   // overflow-x + (opsional) scroll Y dengan header sticky; bordered = bingkai kartu
 *   <Table>
 *     <THead><Tr><Th>Nama</Th><Th align="right" sort="asc" onSort={...}>Skor</Th></Tr></THead>
 *     <TBody><Tr onClick={...}><Td>...</Td></Tr></TBody>
 *   </Table>
 * </TableContainer>
 */
export function TableContainer({ maxHeight, bordered, className, children }) {
  return (
    <div
      className={cn(
        'w-full overflow-x-auto',
        bordered ? 'rounded-2xl bg-white ring-1 ring-inset ring-mist-100 [&_th]:!rounded-none [&_thead_th]:border-b [&_thead_th]:border-mist-100' : 'rounded-xl',
        maxHeight && 'overflow-y-auto',
        className,
      )}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {children}
    </div>
  );
}

export function Table({ className, dense, children, ...props }) {
  return (
    <table className={cn('w-full min-w-[640px] border-separate border-spacing-0 text-left text-sm', dense && '[&_td]:h-11 [&_td]:py-2', className)} {...props}>
      {children}
    </table>
  );
}

/** sticky: header menempel saat TableContainer di-scroll (default true). */
export function THead({ sticky = true, className, children }) {
  return <thead className={cn(sticky && '[&_th]:sticky [&_th]:top-0 [&_th]:z-[1]', className)}>{children}</thead>;
}

export function TBody({ className, children }) {
  return <tbody className={cn('[&>tr:last-child>td]:border-b-0', className)}>{children}</tbody>;
}

/** Tr: onClick membuat baris dapat diklik (hover + kursor). selected: sorot baris. */
export function Tr({ className, onClick, selected, children, ...props }) {
  return (
    <tr
      onClick={onClick}
      className={cn('group/tr transition-colors', onClick && 'cursor-pointer', selected ? '[&>td]:bg-cobalt-50/60' : 'hover:[&>td]:bg-mist-50', className)}
      {...props}
    >
      {children}
    </tr>
  );
}

/**
 * Th: align ('left'|'center'|'right') · width · sort ('asc'|'desc'|null) + onSort → kolom dapat diurutkan.
 * Sel pertama & terakhir header otomatis membulat.
 */
export function Th({ align = 'left', width, sort, onSort, className, children, ...props }) {
  const sortable = typeof onSort === 'function';
  const Icon = sort === 'asc' ? ArrowUp : sort === 'desc' ? ArrowDown : ChevronsUpDown;
  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      aria-sort={sort === 'asc' ? 'ascending' : sort === 'desc' ? 'descending' : sortable ? 'none' : undefined}
      className={cn(
        'h-11 whitespace-nowrap bg-ghost px-4 text-[11px] font-semibold uppercase tracking-wider text-mist-700 first:rounded-l-xl first:pl-5 last:rounded-r-xl last:pr-5',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          className={cn('inline-flex items-center gap-1 rounded-md uppercase tracking-wider hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt', align === 'right' && 'flex-row-reverse')}
        >
          {children}
          <Icon className={cn('h-3.5 w-3.5', sort ? 'text-obsidian' : 'text-mist')} aria-hidden />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

/** Td: align · muted (teks abu) · mono (angka/kode) · nowrap */
export function Td({ align = 'left', muted, mono, nowrap, className, children, ...props }) {
  return (
    <td
      className={cn(
        'h-14 border-b border-mist-100 px-4 py-3 align-middle first:pl-5 last:pr-5',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        muted ? 'text-mist-700' : 'text-obsidian',
        mono && 'font-mono tabular-nums',
        nowrap && 'whitespace-nowrap',
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/** Baris kosong / pemuatan dalam tabel. colSpan wajib = jumlah kolom. */
export function TableEmpty({ colSpan, children }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-14 text-center text-sm text-mist-700">
        {children}
      </td>
    </tr>
  );
}

/** Baris skeleton tabel. */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r}>
      {Array.from({ length: cols }).map((__, c) => (
        <td key={c} className="h-14 border-b border-mist-100 px-4 py-3 first:pl-5 last:pr-5">
          <span className="block h-4 animate-pulse rounded-md bg-mist-100" style={{ width: `${40 + ((r * 7 + c * 13) % 50)}%` }} />
        </td>
      ))}
    </tr>
  ));
}

export default Table;
