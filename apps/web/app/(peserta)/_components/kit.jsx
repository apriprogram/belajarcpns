'use client';

import { useId, useRef } from 'react';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Info, Minus, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/*
 * Blok bangunan tampilan panel peserta (Style UI v2 "Calm Workspace" — dashboard medis).
 * Datar: permukaan putih + garis 1px mist-100, tanpa shadow. Dipakai hanya di app/(peserta).
 */

/** Permukaan kartu datar. */
export function Panel({ as: Tag = 'div', padding = 'md', className, children, ...props }) {
  const pad = { none: '', sm: 'p-4 sm:p-5', md: 'p-5 sm:p-6', lg: 'p-5 sm:p-8' }[padding] ?? 'p-5 sm:p-6';
  return (
    <Tag className={cn('rounded-[20px] bg-white ring-1 ring-inset ring-mist-100', pad, className)} {...props}>
      {children}
    </Tag>
  );
}

/** Kotak ikon kecil bergaris (h-9 w-9 rounded-xl). */
export function IconBox({ icon: Icon, tone = 'plain', size = 'md', className }) {
  const tones = {
    plain: 'bg-white text-obsidian-600 ring-1 ring-inset ring-mist-100',
    cobalt: 'bg-cobalt-50 text-cobalt ring-1 ring-inset ring-cobalt-100',
    mint: 'bg-mint-50 text-mint-700 ring-1 ring-inset ring-mint-100',
    warning: 'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning/20',
    danger: 'bg-danger-50 text-danger ring-1 ring-inset ring-danger/15',
    ghost: 'bg-ghost text-obsidian-600',
    obsidian: 'bg-obsidian text-mint',
  };
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-xl', size === 'lg' ? 'h-11 w-11' : 'h-9 w-9', tones[tone] || tones.plain, className)} aria-hidden>
      <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-[18px] w-[18px]'} strokeWidth={1.75} />
    </span>
  );
}

/** Ikon info kecil dengan tooltip native (title) + teks untuk pembaca layar. */
export function InfoHint({ text }) {
  if (!text) return null;
  return (
    <span className="inline-flex text-mist-500" title={text}>
      <Info className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      <span className="sr-only">{text}</span>
    </span>
  );
}

/** Tombol/tautan kecil sekunder ("Detail") ala dashboard medis. */
export function DetailLink({ href, children = 'Detail', className, ...props }) {
  const cls = cn(
    'inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-white px-3.5 text-[13px] font-semibold max-sm:h-8 max-sm:px-3 max-sm:text-xs text-obsidian ring-1 ring-inset ring-mist-100 transition-colors hover:bg-mist-50 hover:ring-mist focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
    className,
  );
  if (href)
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

/** Header kartu: judul 15px + ikon info + aksi kanan. */
export function PanelHeader({ title, info, subtitle, action, as: T = 'h2', className }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <T className="text-[14px] font-semibold tracking-[-0.01em] text-obsidian sm:text-[15px]">{title}</T>
          <InfoHint text={info} />
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-mist-700 sm:text-[13px]">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/** Pill delta: positif mint, negatif merah, nol abu. value angka; text menimpa tampilan. */
export function DeltaPill({ value, text, suffix = '', className, ...props }) {
  const v = Number(value) || 0;
  const dir = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
  return (
    <span
      {...props}
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-0.5 rounded-full px-2 text-xs font-semibold tabular-nums',
        dir === 'up' && 'bg-mint-50 text-mint-700',
        dir === 'down' && 'bg-danger-50 text-danger-700',
        dir === 'flat' && 'bg-ghost text-mist-700',
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {text ?? `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}${suffix}`}
    </span>
  );
}

/** Pill netral kecil (mis. "120 soal"). */
export function SoftPill({ children, tone = 'mint', className }) {
  const tones = { mint: 'bg-mint-50 text-mint-700', cobalt: 'bg-cobalt-50 text-cobalt-700', ghost: 'bg-ghost text-mist-700', warning: 'bg-warning-50 text-warning-700', danger: 'bg-danger-50 text-danger-700' };
  return <span className={cn('inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-semibold tabular-nums', tones[tone] || tones.ghost, className)}>{children}</span>;
}

/** Sparkline SVG kecil (garis cobalt melengkung). values: number[] */
export function Sparkline({ values = [], width = 132, height = 40, className, label }) {
  const pts = values.length ? values : [0, 0];
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const span = max - min || 1;
  const step = pts.length > 1 ? (width - 4) / (pts.length - 1) : 0;
  const xy = pts.map((v, i) => [2 + i * step, height - 3 - ((v - min) / span) * (height - 6)]);
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1];
    const [x1, y1] = xy[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const last = xy[xy.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={cn('shrink-0 overflow-visible', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={d} fill="none" stroke="#3765F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="#fff" stroke="#3765F6" strokeWidth="2" />
    </svg>
  );
}

/** Batang tipis bergaris (kapasitas): total batang, filled terisi cobalt, sisanya cobalt-100. */
export function MeterBars({ total = 18, filled = 0, className, label }) {
  return (
    <div className={cn('flex h-9 items-stretch gap-[3px]', className)} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn('w-[5px] rounded-full', i < filled ? 'bg-cobalt' : 'bg-cobalt-100')} />
      ))}
    </div>
  );
}

/** Bar progres tipis datar. */
export function ThinBar({ value = 0, max = 100, tone = 'cobalt', className, label }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  const fill = { cobalt: 'bg-cobalt', mint: 'bg-mint-700', danger: 'bg-danger', warning: 'bg-warning', obsidian: 'bg-obsidian' }[tone] || 'bg-cobalt';
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-cobalt-50', className)} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-label={label}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Kartu statistik (dashboard medis): judul + info + aksi, kotak ikon + angka besar + pill delta,
 * lalu grafik mini di kiri dan keterangan di kanan.
 */
export function StatTile({ title, info, action, icon, iconTone, value, suffix, pill, chart, caption, loading, className }) {
  return (
    <Panel padding="none" className={cn('flex flex-col p-5', className)}>
      <PanelHeader title={title} info={info} action={action} as="h3" className="mb-4" />
      <div className="flex items-center gap-3">
        {icon && <IconBox icon={icon} tone={iconTone} />}
        {loading ? (
          <span className="h-8 w-24 animate-pulse rounded-lg bg-mist-100" />
        ) : (
          <p className="flex items-baseline gap-1 text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-obsidian sm:text-[32px] sm:tracking-[-0.03em]">
            {value ?? '—'}
            {suffix && <span className="text-sm font-medium tracking-normal text-mist-500 sm:text-base">{suffix}</span>}
          </p>
        )}
        {!loading && pill}
      </div>
      {(chart || caption) && (
        <div className="mt-4 flex items-end justify-between gap-4">
          {chart && <div className="min-w-0 flex-1">{chart}</div>}
          {caption && <p className={cn('text-xs leading-snug text-mist-700 sm:text-[13px]', chart ? 'max-w-[54%] text-right sm:text-left' : '')}>{caption}</p>}
        </div>
      )}
    </Panel>
  );
}

/**
 * Header halaman bertema biru-putih: breadcrumb kecil, judul 28px, deskripsi satu kalimat, aksi.
 * crumbs: [{ href?, label }] · meta: chip di bawah deskripsi · children: konten di bawah panel (mis. filter).
 * mascot: src gambar maskot (PNG/WEBP transparan) → tampil di kanan, aksi pindah ke bawah deskripsi.
 */
export function PageHead({ title, description, actions, crumbs, meta, mascot, className, children }) {
  return (
    <div className={cn('mb-4 sm:mb-5', className)}>
      <header
        className={cn(
          'relative isolate overflow-hidden rounded-[24px] bg-white ring-1 ring-inset ring-cobalt-100',
          mascot ? 'px-5 pt-5 sm:px-7 sm:pt-6 md:min-h-[188px]' : 'px-5 py-5 sm:px-6',
        )}
      >
        {/* Ornamen: grid titik halus + lingkaran biru lembut */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(#DCE5FE_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(90deg,transparent_25%,#000_75%)]"
        />
        {/* Gradasi biru tipis dari sisi maskot (kanan) memudar ke arah teks */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full bg-gradient-to-l from-cobalt-100/90 via-cobalt-50/50 to-transparent md:w-2/3" />

        <div className={cn('flex flex-col gap-4', mascot ? 'sm:pr-56 lg:pr-72' : 'md:flex-row md:items-center md:justify-between')}>
          <div className={cn('min-w-0', mascot && 'pb-5 sm:pb-6')}>
            {crumbs && crumbs.length > 0 && (
              <nav aria-label="Breadcrumb" className="mb-2">
                <ol className="flex flex-wrap items-center gap-1 text-xs text-mist-700 sm:text-[13px]">
                  {crumbs.map((c, i) => (
                    <li key={i} className="inline-flex items-center gap-1">
                      {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-cobalt/50" aria-hidden />}
                      {c.href ? (
                        <Link href={c.href} className="rounded-md font-medium transition-colors max-sm:inline-flex max-sm:min-h-9 max-sm:items-center hover:text-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">
                          {c.label}
                        </Link>
                      ) : i === crumbs.length - 1 ? (
                        <span aria-current="page" className="rounded-full bg-white px-2 py-0.5 font-medium text-cobalt-700 ring-1 ring-inset ring-cobalt-100">
                          {c.label}
                        </span>
                      ) : (
                        <span>{c.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            <h1 className="text-[20px] font-semibold leading-tight tracking-[-0.015em] text-obsidian sm:text-[30px] sm:tracking-[-0.02em]">{title}</h1>
            {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-mist-700">{description}</p>}
            {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
            {mascot && actions && <div className="mt-4 flex flex-wrap items-center gap-2 [&_a]:!shadow-none [&_button]:!shadow-none max-sm:[&>*]:flex-1">{actions}</div>}
          </div>
          {!mascot && actions && <div className="flex shrink-0 flex-wrap items-center gap-2 [&_a]:!shadow-none [&_button]:!shadow-none max-sm:[&>*]:flex-1">{actions}</div>}
        </div>

        {mascot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mascot}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute -bottom-3 right-4 hidden h-[200px] w-auto select-none object-contain drop-shadow-[0_10px_14px_rgba(31,63,176,0.12)] sm:block lg:right-12 lg:h-[216px] motion-safe:animate-[pagehead-float_6s_ease-in-out_infinite]"
          />
        )}
      </header>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

/**
 * Segmented control (All/Private/Shared): kontainer ghost, item aktif putih bergaris.
 * items: [{ value, label, count? }] · value · onChange · ariaLabel
 */
export function Segmented({ items = [], value, onChange, ariaLabel = 'Filter', size = 'md', className }) {
  const refs = useRef([]);
  const id = useId();
  const onKeyDown = (e, i) => {
    let n = null;
    if (e.key === 'ArrowRight') n = (i + 1) % items.length;
    else if (e.key === 'ArrowLeft') n = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = items.length - 1;
    if (n == null) return;
    e.preventDefault();
    refs.current[n]?.focus();
    onChange?.(items[n].value);
  };
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-ghost p-1 no-scrollbar max-sm:flex max-sm:w-full', className)}>
      {items.map((it, i) => {
        const active = it.value === value;
        return (
          <button
            key={String(it.value)}
            ref={(el) => (refs.current[i] = el)}
            id={`${id}-${i}`}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(it.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] font-medium max-sm:flex-1 max-sm:justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
              size === 'sm' ? 'h-8 px-2.5 text-xs sm:px-3 sm:text-[13px]' : 'h-8 px-3 text-xs sm:h-9 sm:px-3.5 sm:text-sm',
              active ? 'bg-white text-obsidian ring-1 ring-inset ring-mist-100' : 'text-mist-700 hover:text-obsidian',
            )}
          >
            {it.label}
            {it.count != null && (
              <span className={cn('rounded-md px-1.5 py-0.5 font-mono text-[11px] tabular-nums', active ? 'bg-ghost text-obsidian-600' : 'bg-white/70 text-mist-700')}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Kolom pencarian sederhana (ikon kiri, tombol hapus). value + onChange(value). */
export function SearchField({ value, onChange, placeholder = 'Cari…', ariaLabel, className }) {
  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-mist-500" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="h-10 w-full rounded-xl bg-white pl-10 pr-11 text-[16px] text-obsidian sm:h-10 sm:pr-9 sm:text-sm ring-1 ring-inset ring-mist-100 transition-shadow placeholder:text-mist-500 hover:ring-mist focus:outline-none focus:ring-2 focus:ring-cobalt [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 sm:right-2 sm:h-6 sm:w-6 items-center justify-center rounded-full text-mist-700 hover:bg-ghost hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          aria-label="Hapus pencarian"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Skeleton kartu datar. */
export function PanelSkeleton({ className, height = 'h-40' }) {
  return (
    <Panel className={className}>
      <span className="block h-4 w-32 animate-pulse rounded-md bg-mist-100" />
      <span className={cn('mt-5 block w-full animate-pulse rounded-xl bg-ghost', height)} />
    </Panel>
  );
}
