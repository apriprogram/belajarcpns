import { cloneElement, createElement, isValidElement } from 'react';
import { cn } from '@/lib/cn';

/**
 * Render ikon yang bisa berupa elemen (<Plus />) atau komponen (Plus).
 * Dari Server Component, selalu kirim ELEMEN (<Plus />) — fungsi tidak bisa diserialisasi.
 */
export function renderIcon(icon, className, extra = {}) {
  if (!icon) return null;
  if (isValidElement(icon)) {
    return cloneElement(icon, {
      'aria-hidden': true,
      ...extra,
      className: cn(className, icon.props.className),
    });
  }
  if (typeof icon === 'function' || (typeof icon === 'object' && icon.$$typeof)) {
    return createElement(icon, { className, 'aria-hidden': true, ...extra });
  }
  return icon;
}
