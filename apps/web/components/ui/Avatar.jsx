/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

const SIZES = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-xl' };
const PALETTE = ['bg-cobalt-100 text-cobalt-700', 'bg-mint-100 text-mint-700', 'bg-warning-50 text-warning-700', 'bg-mist-100 text-obsidian-600', 'bg-obsidian text-white', 'bg-cobalt text-white'];

function hash(s = '') {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Avatar inisial (warna deterministik dari nama) atau gambar.
 * name · src · size: xs | sm | md | lg | xl · status: 'online' | 'offline' · tone: paksa warna (0–5)
 */
export function Avatar({ name = '', src, size = 'md', status, tone, className }) {
  const color = PALETTE[tone ?? hash(name) % PALETTE.length];
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {src ? (
        <img src={src} alt={name} className={cn('rounded-full object-cover ring-2 ring-white', SIZES[size] || SIZES.md)} />
      ) : (
        <span role="img" aria-label={name || 'Pengguna'} className={cn('inline-flex select-none items-center justify-center rounded-full font-semibold tracking-tight ring-2 ring-white', SIZES[size] || SIZES.md, color)}>
          {initials(name)}
        </span>
      )}
      {status && (
        <span
          className={cn('absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white', status === 'online' ? 'bg-mint-700' : 'bg-mist')}
          aria-label={status === 'online' ? 'Online' : 'Offline'}
        />
      )}
    </span>
  );
}

/** Tumpukan avatar dengan sisa "+N". names: string[] · max (default 4) */
export function AvatarGroup({ names = [], max = 4, size = 'sm', className }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <span className={cn('flex -space-x-2', className)}>
      {shown.map((n, i) => (
        <Avatar key={`${n}-${i}`} name={n} size={size} />
      ))}
      {rest > 0 && (
        <span className={cn('inline-flex items-center justify-center rounded-full bg-cobalt font-semibold text-white ring-2 ring-white', SIZES[size] || SIZES.sm)}>+{rest}</span>
      )}
    </span>
  );
}

export default Avatar;
