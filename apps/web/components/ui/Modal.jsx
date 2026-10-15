'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, IconButton } from './Button';
import { renderIcon } from './_icon';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl', full: 'sm:max-w-[min(1200px,calc(100vw-48px))]' };

let openCount = 0;

/**
 * Modal dialog (portal ke body, ESC menutup, focus trap, kunci scroll, aria-modal).
 * open · onClose · title · icon (ikon opsional di kiri judul) · eyebrow (label kecil uppercase di header)
 * description · size: sm | md | lg | xl | full · footer (tombol aksi, rata kanan) · closeOnOverlay (default true)
 * initialFocus: ref elemen yang difokuskan saat buka · hideClose · divider (garis bawah header, default true)
 * blur: blur latar belakang (default false = hanya gelap transparan, sesuai permintaan desain)
 * Style UI v2: rounded-[24px], satu-satunya elemen ber-shadow (shadow-float). Di mobile tampil sebagai bottom-sheet.
 */
export function Modal({ open, onClose, title, icon, eyebrow, description, size = 'md', footer, closeOnOverlay = true, initialFocus, hideClose, divider = true, blur = false, className, bodyClassName, children }) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);
  const lastActive = useRef(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return undefined;
    lastActive.current = document.activeElement;
    openCount += 1;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const target = (initialFocus && initialFocus.current) || panelRef.current?.querySelector('[data-autofocus]') || panelRef.current?.querySelector(FOCUSABLE) || panelRef.current;
      target?.focus({ preventScroll: true });
    }, 20);
    return () => {
      clearTimeout(t);
      openCount -= 1;
      if (openCount <= 0) document.body.style.overflow = prevOverflow;
      if (lastActive.current && lastActive.current.focus) lastActive.current.focus({ preventScroll: true });
    };
  }, [open, initialFocus]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose && onClose();
      return;
    }
    if (e.key === 'Tab' && panelRef.current) {
      const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter((n) => n.offsetParent !== null);
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!mounted || !open) return null;

  const hasHead = !!(title || eyebrow);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" onKeyDown={onKeyDown}>
      <div className={cn('absolute inset-0 animate-fade-in bg-obsidian/30', blur && 'backdrop-blur-[2px]')} onClick={closeOnOverlay ? onClose : undefined} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasHead ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-[24px] bg-white shadow-float outline-none ring-1 ring-mist-100 sm:max-h-[88vh] sm:rounded-[24px]',
          SIZES[size] || SIZES.md,
          className,
        )}
      >
        {hasHead ? (
          <div className={cn('flex items-start justify-between gap-4 px-6 py-4', divider && 'border-b border-mist-100')}>
            <div className="flex min-w-0 items-start gap-3">
              {icon && <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-obsidian-600 ring-1 ring-inset ring-mist-100">{renderIcon(icon, 'h-[18px] w-[18px]')}</span>}
              <div className={cn('min-w-0', icon && !description && !eyebrow && 'flex min-h-9 flex-col justify-center')}>
                {eyebrow && (
                  <span id={!title ? titleId : undefined} className={cn('inline-flex rounded-lg bg-ghost px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-obsidian-600', title && 'mb-2')}>
                    {eyebrow}
                  </span>
                )}
                {title && (
                  <h2 id={titleId} className="text-lg font-semibold leading-snug tracking-tight">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="mt-1 text-sm leading-relaxed text-mist-700">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {!hideClose && <IconButton icon={<X />} label="Tutup" variant="soft" size="sm" onClick={onClose} className="-mr-1" />}
          </div>
        ) : (
          !hideClose && (
            <div className="flex justify-end px-5 pt-5">
              <IconButton icon={<X />} label="Tutup" variant="soft" size="sm" onClick={onClose} />
            </div>
          )
        )}
        {!hasHead && description && (
          <p id={descId} className="sr-only">
            {description}
          </p>
        )}
        <div className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-5', !hasHead && !hideClose && 'pt-1', bodyClassName)}>{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-mist-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Dialog konfirmasi.
 * open · onClose · onConfirm (boleh async → tombol loading otomatis; modal tertutup setelah sukses)
 * title · description · confirmText ("Ya, lanjutkan") · cancelText ("Batal") · tone: 'danger' | 'default'
 * loading (manual) · icon · children (konten tambahan, mis. ringkasan)
 */
export function ConfirmDialog({ open, onClose, onConfirm, title = 'Anda yakin?', description, confirmText, cancelText = 'Batal', tone = 'default', loading, icon, children }) {
  const [busy, setBusy] = useState(false);
  const isDanger = tone === 'danger';
  const handleConfirm = async () => {
    if (!onConfirm) return onClose && onClose();
    try {
      setBusy(true);
      const r = await onConfirm();
      if (r !== false && onClose) onClose();
    } catch {
      // biarkan pemanggil menampilkan toast error
    } finally {
      setBusy(false);
    }
  };
  const isLoading = loading || busy;
  return (
    <Modal open={open} onClose={isLoading ? () => {} : onClose} size="sm" hideClose closeOnOverlay={!isLoading} bodyClassName="pt-6">
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
        <span className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-xl', isDanger ? 'bg-danger-50 text-danger' : 'bg-cobalt-50 text-cobalt')}>
          {icon || (isDanger ? <AlertTriangle className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />)}
        </span>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-mist-700">{description}</p>}
        {children && <div className="mt-4 w-full">{children}</div>}
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button variant={isDanger ? 'danger' : 'primary'} onClick={handleConfirm} loading={isLoading} data-autofocus>
          {confirmText || (isDanger ? 'Ya, hapus' : 'Ya, lanjutkan')}
        </Button>
      </div>
    </Modal>
  );
}

export default Modal;
