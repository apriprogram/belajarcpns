import { cn } from '@/lib/cn';

/** Peta status → label & warna. Bisa ditambah tanpa mengubah komponen lain. */
export const BADGE_STATUS = {
  lulus: { label: 'Lulus', tone: 'mint' },
  gagal: { label: 'Tidak lulus', tone: 'danger' },
  berlangsung: { label: 'Berlangsung', tone: 'cobalt', pulse: true },
  menunggu: { label: 'Menunggu', tone: 'warning' },
  selesai: { label: 'Selesai', tone: 'mint' },
  draft: { label: 'Draf', tone: 'mist' },
  terbit: { label: 'Terbit', tone: 'cobalt' },
  arsip: { label: 'Arsip', tone: 'obsidian' },
  aktif: { label: 'Aktif', tone: 'mint' },
  diblokir: { label: 'Diblokir', tone: 'danger' },
  blocked: { label: 'Diblokir', tone: 'danger' },
  active: { label: 'Aktif', tone: 'mint' },
  tersedia: { label: 'Tersedia', tone: 'mint' },
  belum_dibuka: { label: 'Belum dibuka', tone: 'warning' },
  ditutup: { label: 'Ditutup', tone: 'mist' },
  benar: { label: 'Benar', tone: 'mint' },
  salah: { label: 'Salah', tone: 'danger' },
  kosong: { label: 'Kosong', tone: 'mist' },
  mudah: { label: 'Mudah', tone: 'mint' },
  sedang: { label: 'Sedang', tone: 'warning' },
  sulit: { label: 'Sulit', tone: 'danger' },
  rendah: { label: 'Rendah', tone: 'mist' },
  tinggi: { label: 'Tinggi', tone: 'danger' },
  online: { label: 'Online', tone: 'mint', pulse: true },
};

// Style UI v2: pill outline-tint — latar tint sangat lembut + garis tipis berwarna.
const TONES = {
  mint: { box: 'bg-mint-50 text-mint-700', ring: 'ring-mint-700/30', dot: 'bg-mint-700' },
  danger: { box: 'bg-danger-50 text-danger-700', ring: 'ring-danger/35', dot: 'bg-danger' },
  cobalt: { box: 'bg-cobalt-50 text-cobalt-700', ring: 'ring-cobalt/35', dot: 'bg-cobalt' },
  warning: { box: 'bg-warning-50 text-warning-700', ring: 'ring-warning/45', dot: 'bg-warning' },
  mist: { box: 'bg-mist-50 text-mist-700', ring: 'ring-mist', dot: 'bg-mist-500' },
  obsidian: { box: 'bg-obsidian/[0.04] text-obsidian-600', ring: 'ring-obsidian/20', dot: 'bg-obsidian-600' },
};

/**
 * Badge status (pill).
 * status: lulus | gagal | berlangsung | menunggu | selesai | draft | terbit | arsip | aktif | diblokir |
 *         tersedia | belum_dibuka | ditutup | benar | salah | kosong | mudah | sedang | sulit | online ...
 * children menimpa label default · tone menimpa warna · dot (default true) · size: sm | md
 * variant: 'outline' (default, tint + garis berwarna) | 'soft' (tint tanpa garis)
 */
export function Badge({ status, tone, dot = true, size = 'md', variant = 'outline', className, children }) {
  const conf = BADGE_STATUS[status] || { label: status, tone: 'mist' };
  const t = TONES[tone || conf.tone] || TONES.mist;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium',
        size === 'sm' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-xs',
        t.box,
        variant !== 'soft' && cn('ring-1 ring-inset', t.ring),
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {conf.pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', t.dot)} />}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', t.dot)} />
        </span>
      )}
      {children ?? conf.label}
    </span>
  );
}

export default Badge;
