import { cn } from '@/lib/cn';
import { renderIcon } from './_icon';

export const CHIP_COLORS = {
  cobalt: 'bg-cobalt-50 text-cobalt-700',
  mint: 'bg-mint-50 text-mint-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  mist: 'bg-ghost text-mist-700',
  obsidian: 'bg-obsidian text-white',
  white: 'bg-white text-obsidian ring-1 ring-inset ring-mist-100',
};
const SIZES = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-[13px] gap-1.5',
  lg: 'h-11 px-4 text-sm gap-2',
};
const ICON = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-[18px] w-[18px]' };

/**
 * Chip metadata ber-tint (mis. tanggal, durasi, subtes).
 * color: cobalt | mint | warning | danger | mist | obsidian | white
 * shape: 'pill' (rounded-full) | 'soft' (rounded-lg/xl) · size: sm | md | lg · mono: angka/jam monospace
 * onClick → dirender sebagai <button>; selected → tampilan aktif.
 */
export function Chip({ color = 'mist', size = 'md', shape = 'pill', icon, mono, onClick, selected, className, children, ...props }) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick && selected !== undefined ? !!selected : undefined}
      className={cn(
        'inline-flex max-w-full shrink-0 items-center whitespace-nowrap font-medium leading-none',
        shape === 'soft' ? (size === 'lg' ? 'rounded-xl' : 'rounded-lg') : 'rounded-full',
        SIZES[size] || SIZES.md,
        selected ? 'bg-obsidian text-white' : CHIP_COLORS[color] || CHIP_COLORS.mist,
        onClick && 'cursor-pointer transition-colors hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-1',
        mono && 'font-mono tabular-nums',
        className,
      )}
      {...props}
    >
      {renderIcon(icon, cn(ICON[size] || ICON.md, 'shrink-0'))}
      <span className="truncate">{children}</span>
    </Tag>
  );
}

/** Kode subtes → warna chip standar. TWK=cobalt, TIU=warning, TKP=mint. */
export const SUBTEST_COLOR = { TWK: 'cobalt', TIU: 'warning', TKP: 'mint' };

export default Chip;
