import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { renderIcon } from './_icon';

const PADDING = { none: '', sm: 'p-4 sm:p-5', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-7' };
// Style UI v2: datar — permukaan putih + garis 1px mist-100, tanpa shadow.
const VARIANTS = {
  white: 'bg-white ring-1 ring-inset ring-mist-100',
  ghost: 'bg-ghost',
  outline: 'bg-white ring-1 ring-inset ring-mist-100',
  obsidian: 'bg-obsidian text-white',
  mint: 'bg-mint-50 ring-1 ring-inset ring-mint-100',
  cobalt: 'bg-cobalt-50 ring-1 ring-inset ring-cobalt-100',
};
const RADIUS = { sm: 'rounded-2xl', md: 'rounded-[20px]', lg: 'rounded-[24px]' };

/**
 * Kartu panel: putih, rounded-[20px], garis 1px mist-100, tanpa shadow.
 * variant: white | ghost | outline | obsidian | mint | cobalt · padding: none | sm | md | lg
 * radius: 'md' (20) | 'sm' (16) | 'lg' (24) · interactive: efek hover (garis menebal)
 */
export function Card({ as: Tag = 'div', variant = 'white', padding = 'md', radius = 'md', interactive, className, children, ...props }) {
  return (
    <Tag
      className={cn(
        RADIUS[radius] || RADIUS.md,
        VARIANTS[variant] || VARIANTS.white,
        PADDING[padding] ?? PADDING.md,
        interactive && 'transition-colors duration-150 hover:bg-mist-50/60 hover:ring-mist',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

const ICON_TONES = {
  cobalt: 'text-cobalt',
  mint: 'text-mint-700',
  warning: 'text-warning-700',
  danger: 'text-danger',
  mist: 'text-obsidian-600',
  obsidian: 'text-obsidian',
};
const TINT_TONES = {
  cobalt: 'bg-cobalt-50 text-cobalt',
  mint: 'bg-mint-100 text-mint-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger',
  mist: 'bg-ghost text-obsidian-600',
  obsidian: 'bg-obsidian text-white',
};

/** Kotak ikon 36px (Style UI v2). variant: 'box' (putih + garis, ikon berwarna) | 'tint' (latar tint). */
export function IconBox({ icon, tone = 'cobalt', variant = 'box', size = 'md', className }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl',
        size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9',
        variant === 'tint' ? TINT_TONES[tone] || TINT_TONES.cobalt : cn('bg-white ring-1 ring-inset ring-mist-100', ICON_TONES[tone] || ICON_TONES.cobalt),
        className,
      )}
    >
      {renderIcon(icon, size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-5 w-5' : 'h-[18px] w-[18px]')}
    </span>
  );
}

/**
 * Header kartu: [ikon] judul (+ ikon info) (+ subjudul) di kiri, aksi di kanan (mis. Button secondary sm "Detail").
 * icon · iconTone: cobalt | mint | warning | danger | mist | obsidian · iconVariant: 'box' (default) | 'tint'
 * info: teks bantuan → ikon (i) kecil di samping judul (title & aria-label) · size: sm | md | lg
 */
export function CardHeader({ title, subtitle, action, icon, iconTone = 'cobalt', iconVariant = 'box', info, className, titleAs: T = 'h3', size = 'md' }) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconBox icon={icon} tone={iconTone} variant={iconVariant} />}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <T className={cn('font-semibold tracking-tight', size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : 'text-[14px] sm:text-[15px]')}>{title}</T>
            {info && (
              <span title={typeof info === 'string' ? info : undefined} aria-label={typeof info === 'string' ? info : 'Info'} role="img" className="inline-flex text-mist-500">
                <Info className="h-4 w-4" aria-hidden />
              </span>
            )}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-mist-700 sm:text-[13px]">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="-my-1 flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export default Card;
