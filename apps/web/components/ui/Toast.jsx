'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, cls: 'text-mint-700 bg-mint-50' },
  error: { icon: AlertCircle, cls: 'text-danger bg-danger-50' },
  warning: { icon: AlertTriangle, cls: 'text-warning-700 bg-warning-50' },
  info: { icon: Info, cls: 'text-cobalt bg-cobalt-50' },
};

let seq = 0;

/** Pasang sekali di root (sudah di <Providers>). */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);
  const timers = useRef({});
  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback(
    (input) => {
      const t = typeof input === 'string' ? { title: input } : input || {};
      const id = ++seq;
      const item = { id, tone: t.tone || 'info', title: t.title, description: t.description, action: t.action, duration: t.duration ?? (t.tone === 'error' ? 6000 : 4000) };
      setToasts((list) => [...list.slice(-3), item]);
      if (item.duration > 0) timers.current[id] = setTimeout(() => dismiss(id), item.duration);
      return id;
    },
    [dismiss],
  );

  const api = useMemo(() => {
    const fn = (x) => toast(x);
    const mk = (tone) => (title, description, opts = {}) => toast({ ...opts, tone, title, description });
    fn.toast = toast;
    fn.success = mk('success');
    fn.error = mk('error');
    fn.warning = mk('warning');
    fn.info = mk('info');
    fn.dismiss = dismiss;
    return fn;
  }, [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6">
            {toasts.map((t) => {
              const tone = TONES[t.tone] || TONES.info;
              const Icon = tone.icon;
              return (
                <div
                  key={t.id}
                  role={t.tone === 'error' ? 'alert' : 'status'}
                  className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl bg-white p-3.5 pr-3 shadow-float ring-1 ring-mist-100"
                >
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone.cls)}>
                    <Icon className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    {t.title && <p className="text-sm font-semibold text-obsidian">{t.title}</p>}
                    {t.description && <p className="mt-0.5 text-[13px] leading-snug text-mist-700">{t.description}</p>}
                    {t.action && (
                      <button
                        type="button"
                        onClick={() => {
                          t.action.onClick && t.action.onClick();
                          dismiss(t.id);
                        }}
                        className="mt-2 rounded-md text-[13px] font-semibold text-cobalt hover:text-cobalt-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                      >
                        {t.action.label}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-mist-500 transition-colors hover:bg-ghost hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

/**
 * const toast = useToast();
 * toast.success('Tersimpan'); toast.error('Gagal', err.message); toast({ title, description, tone, duration, action:{label,onClick} })
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>');
  return ctx;
}

export default ToastProvider;
