'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Opsi jawaban besar (A–E) — dipakai di ruang ujian, latihan, dan pembahasan.
 * state: 'default' | 'selected' | 'correct' | 'wrong' | 'muted'
 * label: huruf · body: teks opsi · trailing: elemen di kanan (mis. chip bobot)
 * note: teks kecil di bawah opsi (mis. "Jawaban Anda") · onClick (tanpa onClick → tampilan saja)
 */
export function OptionButton({ label, body, state = 'default', onClick, disabled, trailing, note, className, ...props }) {
  const interactive = !!onClick && !disabled;
  const Tag = onClick ? 'button' : 'div';
  const box = {
    default: 'bg-ghost text-obsidian-600 group-hover:bg-mist-100',
    selected: 'bg-cobalt text-white',
    correct: 'bg-mint text-obsidian',
    wrong: 'bg-danger text-white',
    muted: 'bg-ghost text-mist-500',
  }[state];
  const shell = {
    default: 'bg-white ring-1 ring-mist-100',
    selected: 'bg-cobalt-50 ring-2 ring-cobalt',
    correct: 'bg-mint-50 ring-2 ring-mint-700/40',
    wrong: 'bg-danger-50 ring-2 ring-danger/50',
    muted: 'bg-white ring-1 ring-mist-100',
  }[state];
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={interactive ? onClick : undefined}
      disabled={onClick ? disabled : undefined}
      aria-pressed={onClick ? state === 'selected' : undefined}
      className={cn(
        'group flex w-full items-start gap-4 rounded-[20px] p-3.5 text-left transition-all duration-150 sm:p-4',
        shell,
        interactive && state === 'default' && 'hover:bg-mist-50 hover:ring-mist',
        interactive && 'cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/25 active:scale-[0.995]',
        onClick && disabled && 'cursor-default',
        className,
      )}
      {...props}
    >
      <span className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-semibold transition-colors', box)} aria-hidden>
        {label}
        {(state === 'correct' || state === 'wrong') && (
          <span
            className={cn(
              'absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-2 ring-white',
              state === 'correct' ? 'bg-mint-700 text-white' : 'bg-danger-700 text-white',
            )}
          >
            {state === 'correct' ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1 pt-1.5">
        <span className="sr-only">Opsi {label}: </span>
        <span className={cn('block whitespace-pre-line text-[15px] leading-relaxed', state === 'muted' ? 'text-obsidian-600' : 'text-obsidian')}>{body}</span>
        {note && <span className="mt-1.5 block text-xs font-semibold">{note}</span>}
      </span>
      {trailing && <span className="shrink-0 self-center">{trailing}</span>}
    </Tag>
  );
}

export default OptionButton;
