'use client';

import { cloneElement, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Panel melayang generik (portal + posisi fixed, otomatis membalik ke atas bila ruang kurang).
 * trigger: elemen pemicu (onClick & aria diisi otomatis) · children: node atau ({ close }) => node
 * open + onOpenChange(bool) (terkontrol, opsional) · align: 'start' | 'end' · width (px | 'trigger' | 'auto')
 * role: 'dialog' (default) · ariaLabel · Tutup dengan klik di luar & Escape (fokus kembali ke pemicu).
 */
export function Popover({ trigger, children, open: openProp, onOpenChange, align = 'start', width = 'auto', role = 'dialog', ariaLabel, className, offset = 6 }) {
  const [inner, setInner] = useState(false);
  const open = openProp !== undefined ? openProp : inner;
  const [pos, setPos] = useState({ top: -9999, left: -9999, width: undefined });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const id = useId();

  const setOpen = useCallback(
    (v) => {
      if (openProp === undefined) setInner(v);
      onOpenChange && onOpenChange(v);
    },
    [openProp, onOpenChange],
  );
  const close = useCallback(
    (refocus = true) => {
      setOpen(false);
      if (refocus) triggerRef.current?.focus?.();
    },
    [setOpen],
  );

  const place = useCallback(() => {
    const el = triggerRef.current;
    const panel = panelRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pw = width === 'trigger' ? r.width : typeof width === 'number' ? width : panel ? panel.offsetWidth : 320;
    const ph = panel ? panel.offsetHeight : 320;
    const placeUp = r.bottom + ph + offset + 8 > window.innerHeight && r.top > ph + offset + 8;
    let left = align === 'end' ? r.right - pw : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    setPos({ top: placeUp ? r.top - ph - offset : r.bottom + offset, left, width: width === 'trigger' || typeof width === 'number' ? pw : undefined });
  }, [align, width, offset]);

  useIsoLayoutEffect(() => {
    if (!open) return undefined;
    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      close(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open, close]);

  const onPanelKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // jangan ikut menutup Modal induk
      close();
    }
  };

  const trig = isValidElement(trigger)
    ? cloneElement(trigger, {
        ref: triggerRef,
        'aria-haspopup': role,
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: (e) => {
          trigger.props.onClick && trigger.props.onClick(e);
          setOpen(!open);
        },
        onKeyDown: (e) => {
          trigger.props.onKeyDown && trigger.props.onKeyDown(e);
          if (e.key === 'Escape' && open) {
            e.preventDefault();
            e.stopPropagation();
            close();
          } else if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        },
      })
    : null;

  return (
    <>
      {trig}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            id={id}
            role={role}
            aria-label={ariaLabel}
            tabIndex={-1}
            onKeyDown={onPanelKey}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className={cn('fixed z-[90] animate-scale-in rounded-2xl bg-white shadow-float ring-1 ring-mist-100 focus:outline-none', className)}
          >
            {typeof children === 'function' ? children({ close }) : children}
          </div>,
          document.body,
        )}
    </>
  );
}

export default Popover;
