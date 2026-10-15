import { isValidElement, cloneElement } from 'react';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui';

/**
 * Primitif tampilan panel admin ("Calm Workspace", docs/STYLE-UI-V2.md).
 * Datar: permukaan putih + garis 1px mist-100, tanpa shadow. Dipakai semua halaman /admin.
 */

/** Render ikon lucide dengan ukuran & stroke standar. */
function icon(node, cls = 'h-[18px] w-[18px]') {
  if (!node) return null;
  if (isValidElement(node)) return cloneElement(node, { className: cn(cls, node.props.className), strokeWidth: node.props.strokeWidth ?? 1.75, 'aria-hidden': true });
  return node;
}

/* ------------------------------------------------------------------ */
/* Header halaman                                                       */
/* ------------------------------------------------------------------ */

/**
 * Judul halaman + deskripsi satu kalimat + aksi di kanan.
 * back: { href, label } · meta: chip/badge di bawah deskripsi · children: konten di bawah header.
 */
export function AdminPageHeader({ title, description, actions, back, meta, eyebrow, className, children }) {
  return (
    <header className={cn('mb-6 sm:mb-8', className)}>
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-mist-700 transition-colors hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          {back.label || 'Kembali'}
        </Link>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1.5 text-[13px] font-medium text-mist-700">{eyebrow}</p>}
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-obsidian sm:text-[28px]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist-700">{description}</p>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Panel / kartu                                                        */
/* ------------------------------------------------------------------ */

const PAD = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-5 sm:p-6' };

/** Kartu datar putih rounded-[20px] dengan garis mist-100. tone: 'white' | 'ghost' */
export function Panel({ as: Tag = 'div', padding = 'md', tone = 'white', className, children, ...props }) {
  return (
    <Tag
      className={cn('min-w-0 rounded-[20px]', tone === 'ghost' ? 'bg-ghost' : 'bg-white ring-1 ring-inset ring-mist-100', PAD[padding] ?? PAD.md, className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

/** Tombol info kecil (tooltip via title + teks sr-only). */
export function InfoTip({ text, className }) {
  if (!text) return null;
  return (
    <span className={cn('inline-flex text-mist-500', className)} title={text}>
      <Info className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{text}</span>
    </span>
  );
}

/**
 * Header kartu: judul (+ ikon info) + subjudul, aksi di kanan.
 * icon: ikon opsional dalam IconBox · titleAs: tag judul (default h2)
 */
export function PanelHeader({ title, subtitle, info, action, icon: ic, titleAs: T = 'h2', className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {ic && <IconBox icon={ic} />}
        <div className="min-w-0">
          <T className="flex items-center gap-1.5 text-[15px] font-semibold leading-6 tracking-[-0.01em] text-obsidian">
            <span className="truncate">{title}</span>
            <InfoTip text={info} />
          </T>
          {subtitle && <p className="mt-0.5 text-[13px] leading-relaxed text-mist-700">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

const BOX_TONES = {
  default: 'bg-white text-obsidian-600 ring-mist-100',
  cobalt: 'bg-white text-cobalt ring-mist-100',
  mint: 'bg-white text-mint-700 ring-mist-100',
  warning: 'bg-white text-warning-700 ring-mist-100',
  danger: 'bg-white text-danger ring-mist-100',
  ghost: 'bg-ghost text-obsidian-600 ring-transparent',
};

/** Kotak ikon h-9 w-9 rounded-xl ring-1. */
export function IconBox({ icon: ic, tone = 'default', size = 'md', className }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
        size === 'lg' ? 'h-11 w-11' : size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-9 w-9',
        BOX_TONES[tone] || BOX_TONES.default,
        className,
      )}
      aria-hidden
    >
      {icon(ic, size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]')}
    </span>
  );
}

/** Tombol kecil "Detail" (secondary) — tautan. */
export function DetailButton({ href, children = 'Detail', label }) {
  return (
    <Button variant="secondary" size="sm" href={href} aria-label={label} className="!h-8 !rounded-xl !px-3 !shadow-none">
      {children}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Kartu statistik (gaya dashboard medis)                               */
/* ------------------------------------------------------------------ */

/** Pill delta kecil. tone: mint (naik) | danger | mist */
export function DeltaPill({ children, tone = 'mint', className }) {
  if (children == null || children === '') return null;
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-semibold tabular-nums',
        tone === 'danger' ? 'bg-danger-50 text-danger-700' : tone === 'mist' ? 'bg-ghost text-mist-700' : 'bg-mint-50 text-mint-700',
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Kartu statistik: judul + info + tombol Detail; kotak ikon + angka besar + pill delta; keterangan + mini chart.
 */
export function StatTile({ title, info, href, detailLabel = 'Detail', icon: ic, tone, value, suffix, delta, deltaTone, caption, chart, loading, className }) {
  return (
    <Panel className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex min-w-0 items-center gap-1.5 text-[14px] font-semibold text-obsidian">
          <span className="truncate">{title}</span>
          <InfoTip text={info} />
        </h3>
        {href && <DetailButton href={href} label={`${detailLabel} ${title}`}>{detailLabel}</DetailButton>}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <IconBox icon={ic} tone={tone} />
        {loading ? (
          <span className="h-8 w-24 animate-pulse rounded-lg bg-mist-100" />
        ) : (
          <p className="flex min-w-0 items-baseline gap-1 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-obsidian">
            {value ?? '—'}
            {suffix && <span className="text-sm font-medium tracking-normal text-mist-500">{suffix}</span>}
          </p>
        )}
        {!loading && <DeltaPill tone={deltaTone}>{delta}</DeltaPill>}
      </div>
      {(chart || caption) && (
        <div className="mt-4 flex min-h-[40px] items-end gap-4">
          {chart && <div className="w-[46%] shrink-0">{loading ? <span className="block h-8 animate-pulse rounded-lg bg-mist-50" /> : chart}</div>}
          {caption && <p className="min-w-0 flex-1 text-xs leading-relaxed text-mist-700">{caption}</p>}
        </div>
      )}
    </Panel>
  );
}

/** Sparkline garis halus (SVG). values: number[] */
export function Sparkline({ values = [], height = 36, color = '#3765F6', className, label }) {
  const pts = values.length > 1 ? values : [0, ...(values.length ? values : [0])];
  const w = 120;
  const max = Math.max(1, ...pts);
  const min = Math.min(0, ...pts);
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * w, height - 4 - ((v - min) / (max - min || 1)) * (height - 8)]);
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1];
    const [x1, y1] = xy[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn('block h-9 w-full overflow-visible', className)} role="img" aria-label={label || 'Tren'}>
      <path d={d} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Batang mini (aktivitas harian). values: number[] */
export function MiniBars({ values = [], className, label, highlightLast = true }) {
  const max = Math.max(1, ...values);
  return (
    <div className={cn('flex h-9 items-end gap-[3px]', className)} role="img" aria-label={label || 'Batang aktivitas'}>
      {(values.length ? values : [0]).map((v, i) => (
        <span
          key={i}
          className={cn('min-w-[3px] flex-1 rounded-sm', highlightLast && i === values.length - 1 ? 'bg-cobalt' : 'bg-cobalt/70')}
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

/** Meter batang vertikal bersegmen (seperti kapasitas). value/max, bars = jumlah batang */
export function MeterBars({ value = 0, max = 1, bars = 16, className, label }) {
  const on = max > 0 ? Math.round((Math.min(value, max) / max) * bars) : 0;
  return (
    <div className={cn('flex h-9 items-stretch gap-[3px]', className)} role="img" aria-label={label || `${value} dari ${max}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} className={cn('flex-1 rounded-sm', i < on ? 'bg-cobalt' : 'bg-cobalt-100')} />
      ))}
    </div>
  );
}

/** Bar progres tipis (rounded-full). */
export function ThinProgress({ value = 0, max = 100, tone = 'cobalt', className, label }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-cobalt-50', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <span className={cn('block h-full rounded-full', tone === 'mint' ? 'bg-mint-700' : tone === 'warning' ? 'bg-warning' : tone === 'danger' ? 'bg-danger' : 'bg-cobalt')} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status pill outline                                                  */
/* ------------------------------------------------------------------ */

const PILL = {
  lulus: ['Lulus', 'mint'],
  gagal: ['Tidak lulus', 'danger'],
  draft: ['Draf', 'mist'],
  terbit: ['Terbit', 'cobalt'],
  arsip: ['Arsip', 'obsidian'],
  active: ['Aktif', 'mint'],
  aktif: ['Aktif', 'mint'],
  blocked: ['Diblokir', 'danger'],
  diblokir: ['Diblokir', 'danger'],
  mudah: ['Mudah', 'mint'],
  sedang: ['Sedang', 'warning'],
  sulit: ['Sulit', 'danger'],
  online: ['Online', 'mint'],
};
const PILL_TONES = {
  mint: 'text-mint-700 ring-mint-700/30',
  danger: 'text-danger-700 ring-danger/35',
  cobalt: 'text-cobalt-700 ring-cobalt/35',
  warning: 'text-warning-700 ring-warning/50',
  mist: 'text-mist-700 ring-mist',
  obsidian: 'text-obsidian-600 ring-obsidian/25',
};
const DOT = { mint: 'bg-mint-700', danger: 'bg-danger', cobalt: 'bg-cobalt', warning: 'bg-warning', mist: 'bg-mist-500', obsidian: 'bg-obsidian-600' };

/** Pill status outline tipis berwarna (tabel). status → label & warna; tone/children menimpa. */
export function StatusPill({ status, tone, dot = true, className, children }) {
  const [label, t0] = PILL[status] || [status, 'mist'];
  const t = tone || t0;
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-2.5 text-xs font-medium ring-1 ring-inset', PILL_TONES[t] || PILL_TONES.mist, className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT[t] || DOT.mist)} aria-hidden />}
      {children ?? label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Filter bar & tabel                                                   */
/* ------------------------------------------------------------------ */

/** Baris filter di atas tabel: kiri (segmented), kanan (search, Filter, aksi). */
export function FilterBar({ left, right, className, children }) {
  return (
    <div className={cn('border-b border-mist-100 px-4 py-3 sm:px-5', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {left && <div className="min-w-0 overflow-x-auto no-scrollbar">{left}</div>}
        {right && <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">{right}</div>}
      </div>
      {children}
    </div>
  );
}

/**
 * Pembungkus gaya tabel admin: header ghost uppercase kecil abu, full-bleed di kartu,
 * baris h-14 dengan garis bawah. Bungkus <TableContainer> dari components/ui.
 */
export const TABLE_SKIN = cn(
  '[&_th]:!rounded-none [&_th]:!bg-ghost [&_th]:!py-2.5 [&_th]:!text-[11px] [&_th]:!font-semibold [&_th]:uppercase [&_th]:tracking-[0.06em] [&_th]:!text-mist-700',
  '[&_th]:border-b [&_th]:border-mist-100 [&_td]:!py-3.5',
);

export function TableSkin({ className, children }) {
  return <div className={cn(TABLE_SKIN, className)}>{children}</div>;
}

/** Footer kartu tabel (pagination). */
export function PanelFooter({ className, children }) {
  return <div className={cn('border-t border-mist-100 px-4 py-3 sm:px-5', className)}>{children}</div>;
}

/** Judul modal dengan kotak ikon (gaya "Create a new project"). */
export function ModalTitle({ icon: ic, children }) {
  return (
    <span className="flex items-center gap-3">
      <IconBox icon={ic} size="sm" />
      <span className="min-w-0">{children}</span>
    </span>
  );
}
