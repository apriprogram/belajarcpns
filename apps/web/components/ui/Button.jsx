import Link from 'next/link';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';
import { renderIcon } from './_icon';

// Style UI v2: datar, tanpa shadow. Fokus keyboard = ring-2 cobalt.
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 focus-visible:ring-offset-white';

const VARIANTS = {
  primary: 'bg-obsidian text-white hover:bg-obsidian-800 active:bg-obsidian',
  accent: 'bg-cobalt text-white hover:bg-cobalt-600 active:bg-cobalt-700',
  mint: 'bg-mint text-obsidian hover:brightness-95 active:brightness-90',
  secondary: 'bg-white text-obsidian ring-1 ring-inset ring-mist-100 hover:bg-mist-50 hover:ring-mist focus-visible:ring-offset-0',
  soft: 'bg-ghost text-obsidian hover:bg-mist-100 active:bg-mist-100',
  ghost: 'bg-transparent text-obsidian hover:bg-ghost active:bg-mist-100',
  danger: 'bg-danger text-white hover:bg-danger-700',
  'danger-soft': 'bg-danger-50 text-danger-700 hover:bg-danger/15',
  link: 'bg-transparent text-cobalt hover:text-cobalt-700 underline-offset-4 hover:underline !px-0 !h-auto focus-visible:ring-offset-0',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-[15px] gap-2',
  xl: 'h-14 px-7 text-base gap-2.5',
};
const ICON_SIZES = { sm: 'h-4 w-4', md: 'h-[18px] w-[18px]', lg: 'h-5 w-5', xl: 'h-5 w-5' };
const SHAPES = { rounded: 'rounded-xl', pill: 'rounded-full' };

/**
 * Tombol.
 * variant: primary (obsidian) | accent (cobalt) | mint | secondary (putih + garis) | soft (latar ghost) | ghost | danger | danger-soft | link
 * size: sm (36) | md (44) | lg (48) | xl (56) · shape: 'rounded' (default, rounded-xl) | 'pill' (rounded-full)
 * loading · icon (kiri) · iconRight · fullWidth · href (jadi <Link>)
 */
export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  loading = false,
  disabled,
  icon,
  iconRight,
  fullWidth,
  href,
  className,
  children,
  type,
  ref,
  ...props
}) {
  const isDisabled = disabled || loading;
  const classes = cn(
    'relative inline-flex select-none items-center justify-center whitespace-nowrap font-semibold tracking-[-0.01em] transition-colors duration-150',
    FOCUS,
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    SHAPES[shape] || SHAPES.rounded,
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth && 'w-full',
    loading && 'disabled:opacity-80',
    className,
  );
  const iconCls = ICON_SIZES[size] || ICON_SIZES.md;
  const content = (
    <>
      {loading ? <Spinner size={size === 'sm' ? 'xs' : 'sm'} /> : renderIcon(icon, cn(iconCls, 'shrink-0'))}
      {children != null && <span className={cn(loading && !icon && 'opacity-90')}>{children}</span>}
      {!loading && renderIcon(iconRight, cn(iconCls, 'shrink-0'))}
    </>
  );

  if (href && !isDisabled) {
    return (
      <Link ref={ref} href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type || 'button'} disabled={isDisabled} aria-busy={loading || undefined} className={classes} {...props}>
      {content}
    </button>
  );
}

const ICON_VARIANTS = {
  white: 'bg-white text-obsidian ring-1 ring-inset ring-mist-100 hover:bg-mist-50 hover:ring-mist focus-visible:ring-offset-0',
  dark: 'bg-obsidian text-white hover:bg-obsidian-800',
  accent: 'bg-cobalt text-white hover:bg-cobalt-600',
  ghost: 'bg-transparent text-obsidian-600 hover:bg-ghost hover:text-obsidian',
  outline: 'bg-transparent text-obsidian ring-1 ring-inset ring-mist hover:bg-white focus-visible:ring-offset-0',
  soft: 'bg-ghost text-obsidian hover:bg-mist-100',
  danger: 'bg-danger-50 text-danger hover:bg-danger/15',
};
const ICON_BTN_SIZES = { xs: 'h-7 w-7', sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };
const ICON_INNER = { xs: 'h-3.5 w-3.5', sm: 'h-4 w-4', md: 'h-[18px] w-[18px]', lg: 'h-5 w-5' };
const ICON_SHAPES = { round: 'rounded-full', pill: 'rounded-full', rounded: { xs: 'rounded-lg', sm: 'rounded-lg', md: 'rounded-xl', lg: 'rounded-xl' } };

/**
 * Tombol ikon (default 40px putih bulat).
 * label WAJIB (aria-label & title). variant: white | dark | accent | ghost | outline | soft | danger
 * size: xs | sm | md | lg · shape: 'round' (default, bulat) | 'rounded' (kotak membulat) · dot: titik notifikasi.
 */
export function IconButton({ icon, label, variant = 'white', size = 'md', shape = 'round', dot, loading, href, className, type, ref, ...props }) {
  const shapeCls = shape === 'rounded' ? ICON_SHAPES.rounded[size] || 'rounded-xl' : 'rounded-full';
  const classes = cn(
    'relative inline-flex shrink-0 items-center justify-center transition-colors duration-150',
    FOCUS,
    'disabled:pointer-events-none disabled:opacity-50',
    shapeCls,
    ICON_VARIANTS[variant] || ICON_VARIANTS.white,
    ICON_BTN_SIZES[size] || ICON_BTN_SIZES.md,
    className,
  );
  const inner = (
    <>
      {loading ? <Spinner size="sm" /> : renderIcon(icon, ICON_INNER[size] || ICON_INNER.md)}
      {dot && <span className="absolute right-[7px] top-[7px] h-2 w-2 rounded-full bg-danger ring-2 ring-white" aria-hidden />}
      <span className="sr-only">{label}</span>
    </>
  );
  if (href) {
    return (
      <Link ref={ref} href={href} aria-label={label} title={label} className={classes} {...props}>
        {inner}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type || 'button'} aria-label={label} title={label} className={classes} {...props}>
      {inner}
    </button>
  );
}

export default Button;
