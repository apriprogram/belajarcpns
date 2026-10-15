'use client';

import { cloneElement, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Check, ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';
import { renderIcon } from './_icon';
import { BOX_STATE } from './_field';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Dropdown menu (portal + posisi fixed → aman di dalam tabel ber-overflow).
 * trigger: elemen tombol (onClick & aria diisi otomatis)
 * items: [{ label, icon, onClick, href, danger, disabled, description, active, shortcut }, { divider: true }, { header: 'Judul' }]
 * align: 'end' | 'start' · width (px, default 220, atau 'trigger' = selebar pemicu) · header: konten bebas di atas item
 * children: konten panel kustom (menggantikan items), menerima fungsi ({close}) => node
 * Keyboard: ↑ ↓ Home End, Enter, Esc. Item `active` difokuskan saat dibuka.
 */
export function Dropdown({ trigger, items = [], align = 'end', width = 220, header, children, className, onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: typeof width === 'number' ? width : 220 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const id = useId();

  const setOpenState = useCallback(
    (v) => {
      setOpen(v);
      onOpenChange && onOpenChange(v);
    },
    [onOpenChange],
  );
  const close = useCallback(() => setOpenState(false), [setOpenState]);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = width === 'trigger' ? r.width : width;
    const menuH = menuRef.current ? menuRef.current.offsetHeight : 240;
    const placeUp = r.bottom + menuH + 12 > window.innerHeight && r.top > menuH + 12;
    let left = align === 'end' ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    setPos({ top: placeUp ? r.top - menuH - 6 : r.bottom + 6, left, width: w });
  }, [align, width]);

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
      if (menuRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    const t = setTimeout(() => {
      const first = menuRef.current?.querySelector('[role="menuitem"][data-active="true"]:not([disabled])') || menuRef.current?.querySelector('[role="menuitem"]:not([disabled])');
      if (first) first.focus();
      else menuRef.current?.focus();
    }, 10);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open, close]);

  const onMenuKey = (e) => {
    const nodes = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || []);
    const i = nodes.indexOf(document.activeElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // jangan ikut menutup Modal induk
      close();
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nodes[(i + 1) % nodes.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nodes[(i - 1 + nodes.length) % nodes.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      nodes[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      nodes[nodes.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      close();
    }
  };

  const trig = isValidElement(trigger)
    ? cloneElement(trigger, {
        ref: triggerRef,
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? id : undefined,
        onClick: (e) => {
          trigger.props.onClick && trigger.props.onClick(e);
          setOpenState(!open);
        },
        onKeyDown: (e) => {
          trigger.props.onKeyDown && trigger.props.onKeyDown(e);
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpenState(true);
          }
        },
      })
    : null;

  const itemCls = (it) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
      it.description ? 'min-h-9 py-2' : 'h-9',
      it.danger ? 'text-danger-700 hover:bg-danger-50 focus:bg-danger-50' : 'text-obsidian hover:bg-ghost focus:bg-ghost',
      it.active && !it.danger && 'bg-ghost font-medium',
    );

  return (
    <>
      {trig}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={id}
            role="menu"
            tabIndex={-1}
            onKeyDown={onMenuKey}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className={cn('fixed z-[90] max-h-[min(420px,calc(100vh-24px))] animate-scale-in overflow-y-auto rounded-2xl bg-white p-1.5 shadow-float ring-1 ring-mist-100 focus:outline-none', className)}
          >
            {header}
            {typeof children === 'function' ? children({ close }) : children}
            {!children &&
              items.map((it, i) => {
                if (it.divider) return <div key={`d${i}`} className="-mx-1.5 my-1.5 h-px bg-mist-100" role="separator" />;
                if (it.header) return <p key={`h${i}`} className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-mist-500">{it.header}</p>;
                const content = (
                  <>
                    {it.icon && <span className={cn('shrink-0', it.danger ? 'text-danger' : 'text-obsidian-600')}>{renderIcon(it.icon, 'h-4 w-4')}</span>}
                    <span className="min-w-0 flex-1">
                      <span className={cn('block truncate', it.description ? 'font-medium' : undefined)}>{it.label}</span>
                      {it.description && <span className="block truncate text-xs text-mist-700">{it.description}</span>}
                    </span>
                    {it.shortcut && <kbd className="shrink-0 font-sans text-xs text-mist-500">{it.shortcut}</kbd>}
                    {it.active && <Check className="h-4 w-4 shrink-0 text-cobalt" aria-hidden />}
                  </>
                );
                if (it.href && !it.disabled)
                  return (
                    <Link key={i} href={it.href} role="menuitem" data-active={it.active || undefined} aria-current={it.active ? 'true' : undefined} className={itemCls(it)} onClick={close}>
                      {content}
                    </Link>
                  );
                return (
                  <button
                    key={i}
                    type="button"
                    role="menuitem"
                    data-active={it.active || undefined}
                    disabled={it.disabled}
                    className={itemCls(it)}
                    onClick={() => {
                      close();
                      it.onClick && it.onClick();
                    }}
                  >
                    {content}
                  </button>
                );
              })}
          </div>,
          document.body,
        )}
    </>
  );
}

/** Menu titik tiga (⋯) — pintasan Dropdown dengan IconButton. label untuk aria. */
export function Menu({ items, label = 'Aksi lainnya', align = 'end', width, variant = 'ghost', size = 'sm', shape, vertical, className }) {
  return (
    <Dropdown
      align={align}
      width={width}
      items={items}
      trigger={<IconButton icon={<MoreHorizontal className={vertical ? 'rotate-90' : undefined} />} label={label} variant={variant} size={size} shape={shape} className={className} />}
    />
  );
}

/**
 * Pilihan bergaya Select dengan panel Dropdown (bukan <select> native).
 * options: [{ value, label, icon, description, disabled }] · value · onChange(value)
 * placeholder ("Pilih…") · leftIcon · size: sm | md | lg · state · disabled · fullWidth · ariaLabel
 */
export function SelectMenu({ options = [], value, onChange, placeholder = 'Pilih…', leftIcon, size = 'md', state, invalid, disabled, fullWidth = true, ariaLabel, id, className, menuWidth = 'trigger', align = 'start', ...props }) {
  const st = invalid ? 'error' : state || 'default';
  const current = options.find((o) => o.value === value);
  const h = size === 'sm' ? 'h-9 text-sm' : size === 'lg' ? 'h-12 text-base' : 'h-11 text-[15px]';
  return (
    <Dropdown
      align={align}
      width={menuWidth}
      items={options.map((o) => ({
        label: o.label,
        icon: o.icon,
        description: o.description,
        disabled: o.disabled,
        active: o.value === value,
        onClick: () => onChange && onChange(o.value),
      }))}
      trigger={
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            'group inline-flex items-center gap-2 rounded-xl border bg-white pl-3.5 pr-3 text-left transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:border-cobalt focus-visible:ring-1 focus-visible:ring-cobalt aria-expanded:border-cobalt aria-expanded:ring-1 aria-expanded:ring-cobalt disabled:cursor-not-allowed disabled:bg-mist-50 disabled:text-mist-500',
            BOX_STATE[st],
            h,
            fullWidth ? 'w-full' : 'min-w-[180px]',
            className,
          )}
          {...props}
        >
          {(current?.icon || leftIcon) && <span className="shrink-0 text-obsidian-600">{renderIcon(current?.icon || leftIcon, 'h-[18px] w-[18px]')}</span>}
          <span className={cn('min-w-0 flex-1 truncate', current ? 'text-obsidian' : 'text-mist-500')}>{current ? current.label : placeholder}</span>
          <ChevronDown className="h-[18px] w-[18px] shrink-0 text-mist-700 transition-transform group-aria-expanded:rotate-180" aria-hidden />
        </button>
      }
    />
  );
}

export default Dropdown;
