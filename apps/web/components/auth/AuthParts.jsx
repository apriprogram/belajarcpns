import Link from 'next/link';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Judul + deskripsi di atas form auth (rata tengah, ala Magnific). icon: opsional, untuk layar status. */
export function AuthHeading({ title, description, icon }) {
  return (
    <div className="mb-6 text-center sm:mb-8">
      {icon && <span className="mx-auto mb-4 flex h-12 w-12 sm:mb-5 items-center justify-center rounded-xl bg-ghost text-obsidian">{icon}</span>}
      <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] sm:text-[32px] sm:tracking-[-0.03em]">{title}</h1>
      {description && <p className="mx-auto mt-2 max-w-[340px] text-[15px] leading-relaxed text-mist-700">{description}</p>}
    </div>
  );
}

/** Baris tautan kecil di bawah form: "Belum punya akun? Daftar". */
export function AuthSwitch({ text, href, children }) {
  return (
    <p className="mt-6 text-center text-[15px] text-mist-700 sm:mt-8 sm:text-sm">
      {text}{' '}
      <Link href={href} className="-my-3 inline-flex min-h-11 items-center rounded px-1 font-semibold text-obsidian underline-offset-4 hover:underline sm:my-0 sm:inline sm:min-h-0 sm:px-0">
        {children}
      </Link>
    </p>
  );
}

/**
 * Banner pesan di dalam form (dipakai juga di luar halaman auth).
 * tone: 'error' | 'success' | 'info' · title · children
 */
export function FormAlert({ tone = 'error', title, children, className }) {
  const conf = {
    error: { cls: 'bg-danger-50 text-danger-700 ring-danger/15', Icon: AlertCircle },
    success: { cls: 'bg-mint-50 text-mint-700 ring-mint-100', Icon: CheckCircle2 },
    info: { cls: 'bg-cobalt-50 text-cobalt-700 ring-cobalt-100', Icon: Info },
  }[tone];
  const Icon = conf.Icon;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset', conf.cls, className)}>
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'leading-relaxed')}>{children}</div>}
      </div>
    </div>
  );
}
