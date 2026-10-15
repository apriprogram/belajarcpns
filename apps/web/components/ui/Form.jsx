'use client';

import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, ChevronDown, Eye, EyeOff, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { renderIcon } from './_icon';
import { BOX_STATE, CONTROL_BASE, CONTROL_SIZES, CONTROL_STATE } from './_field';

/* --------------------------------------------------------------------------
 * 5 state input: disabled · default · focus (ring cobalt) · success · error
 * state: 'default' | 'success' | 'error'  (disabled lewat prop `disabled`)
 * Di dalam <Field>, `id`, `state`, aria-invalid & aria-describedby diisi otomatis.
 * ------------------------------------------------------------------------ */

function StateIcon({ state }) {
  if (state === 'error') return <AlertCircle className="h-[18px] w-[18px] text-danger" aria-hidden />;
  if (state === 'success') return <CheckCircle2 className="h-[18px] w-[18px] text-mint-700" aria-hidden />;
  return null;
}

/**
 * Input teks. Props: state, size (sm|md|lg), leftIcon, rightIcon, rightSlot (elemen interaktif), mono,
 * innerLabel (label kecil DI DALAM kotak, di atas nilai — gaya "Date/Time" referensi; tinggi 56px)
 * + semua atribut <input>. `invalid` = alias state="error".
 */
export function Input({ state, invalid, size = 'md', leftIcon, rightIcon, rightSlot, mono, innerLabel, className, wrapperClassName, ref, ...props }) {
  const st = invalid ? 'error' : state || 'default';
  const hasRight = rightIcon || rightSlot || st !== 'default';
  const autoId = useId();

  if (innerLabel) {
    const iid = props.id || autoId;
    return (
      <div
        className={cn(
          'group relative flex min-h-14 w-full items-center gap-3 rounded-xl border bg-white px-4 py-2 transition-[border-color,box-shadow] duration-150',
          BOX_STATE[st],
          props.disabled && 'cursor-not-allowed bg-mist-50',
          wrapperClassName,
        )}
      >
        {leftIcon && <span className="shrink-0 text-obsidian-600 transition-colors group-focus-within:text-cobalt">{renderIcon(leftIcon, 'h-5 w-5')}</span>}
        <span className="flex min-w-0 flex-1 flex-col">
          <label htmlFor={iid} className="text-xs leading-4 text-mist-700">
            {innerLabel}
          </label>
          <input
            ref={ref}
            aria-invalid={st === 'error' || undefined}
            className={cn(
              'peer w-full bg-transparent p-0 text-[15px] font-medium leading-6 text-obsidian outline-none placeholder:font-normal placeholder:text-mist-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:text-mist-500',
              mono && 'font-mono tracking-wide',
              className,
            )}
            {...props}
            id={iid}
          />
        </span>
        {hasRight && (
          <span className="flex shrink-0 items-center gap-1.5">
            {st !== 'default' && <StateIcon state={st} />}
            {rightIcon && <span className="pointer-events-none text-mist-500">{renderIcon(rightIcon, 'h-[18px] w-[18px]')}</span>}
            {rightSlot}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('group relative', wrapperClassName)}>
      {leftIcon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist-500 transition-colors group-focus-within:text-cobalt">{renderIcon(leftIcon, 'h-[18px] w-[18px]')}</span>}
      <input
        ref={ref}
        aria-invalid={st === 'error' || undefined}
        className={cn(
          'peer',
          CONTROL_BASE,
          CONTROL_SIZES[size] || CONTROL_SIZES.md,
          CONTROL_STATE[st],
          leftIcon ? 'pl-10' : 'pl-3.5',
          hasRight ? 'pr-11' : 'pr-3.5',
          rightSlot && st !== 'default' && 'pr-20',
          mono && 'font-mono tracking-wide',
          className,
        )}
        {...props}
      />
      {hasRight && (
        <span className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {st !== 'default' && <StateIcon state={st} />}
          {rightIcon && <span className="pointer-events-none text-mist-500">{renderIcon(rightIcon, 'h-[18px] w-[18px]')}</span>}
          {rightSlot}
        </span>
      )}
    </div>
  );
}

/** Input password dengan tombol tampilkan/sembunyikan. */
export function PasswordInput({ ref, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <Input
      ref={ref}
      type={show ? 'text' : 'password'}
      autoComplete={props.autoComplete || 'current-password'}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          disabled={props.disabled}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-mist-700 transition-colors hover:bg-ghost hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-40"
          aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={show}
        >
          {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
        </button>
      }
      {...props}
    />
  );
}

/** Textarea. Props: state, rows (default 4), + atribut <textarea>. */
export function Textarea({ state, invalid, className, rows = 4, ref, ...props }) {
  const st = invalid ? 'error' : state || 'default';
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={st === 'error' || undefined}
      className={cn(CONTROL_BASE, 'block min-h-[96px] resize-y rounded-xl px-3.5 py-3 leading-relaxed', CONTROL_STATE[st], className)}
      {...props}
    />
  );
}

/**
 * Select native bergaya. options: [{ value, label, disabled }] atau children <option>.
 * placeholder: opsi kosong pertama (value ""). leftIcon opsional.
 */
export function Select({ state, invalid, size = 'md', options, placeholder, className, wrapperClassName, children, leftIcon, ref, ...props }) {
  const st = invalid ? 'error' : state || 'default';
  return (
    <div className={cn('group relative', wrapperClassName)}>
      {leftIcon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist-500 group-focus-within:text-cobalt">{renderIcon(leftIcon, 'h-[18px] w-[18px]')}</span>}
      <select
        ref={ref}
        aria-invalid={st === 'error' || undefined}
        className={cn(CONTROL_BASE, CONTROL_SIZES[size] || CONTROL_SIZES.md, CONTROL_STATE[st], 'cursor-pointer appearance-none pr-10', leftIcon ? 'pl-10' : 'pl-3.5', className)}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options
          ? options.map((o) => (
              <option key={String(o.value)} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))
          : children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-mist-700" aria-hidden />
    </div>
  );
}

/**
 * Checkbox kustom (tetap <input type="checkbox"> asli → aksesibel).
 * label · description · indeterminate · + atribut input (checked, onChange, disabled...)
 */
export function Checkbox({ label, description, indeterminate, className, id, ref, ...props }) {
  const innerRef = useRef(null);
  const autoId = useId();
  const cid = id || autoId;
  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = !!indeterminate;
  }, [indeterminate]);
  const setRefs = (el) => {
    innerRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };
  return (
    <label htmlFor={cid} className={cn('group inline-flex cursor-pointer items-start gap-3', props.disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className="relative mt-px flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          ref={setRefs}
          id={cid}
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-mist bg-white transition-colors checked:border-cobalt checked:bg-cobalt indeterminate:border-cobalt indeterminate:bg-cobalt hover:border-mist-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-mist-50"
          {...props}
        />
        {indeterminate ? (
          <Minus className="pointer-events-none absolute h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden />
        ) : (
          <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
        )}
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-obsidian">{label}</span>}
          {description && <span className="mt-0.5 block text-sm text-mist-700">{description}</span>}
        </span>
      )}
    </label>
  );
}

/**
 * Switch on/off (role="switch"). Track 36×20 (md) · 28×16 (sm); off mist, on cobalt.
 * checked · onChange(nextBool) · label · description · disabled · size: sm | md
 */
export function Switch({ checked = false, onChange, label, description, disabled, size = 'md', className, id, ...props }) {
  const autoId = useId();
  const sid = id || autoId;
  const dims = size === 'sm' ? { track: 'h-4 w-7', knob: 'h-3 w-3', on: 'translate-x-3' } : { track: 'h-5 w-9', knob: 'h-4 w-4', on: 'translate-x-4' };
  const btn = (
    <button
      id={sid}
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        dims.track,
        checked ? 'bg-cobalt' : 'bg-mist hover:bg-mist-500',
      )}
      {...props}
    >
      <span className={cn('rounded-full bg-white transition-transform duration-200', dims.knob, checked ? dims.on : 'translate-x-0')} />
    </button>
  );
  if (!label && !description) return <span className={cn('inline-flex', className)}>{btn}</span>;
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <label htmlFor={sid} className={cn('min-w-0 cursor-pointer', disabled && 'cursor-not-allowed opacity-60')}>
        {label && <span className="block text-sm font-medium text-obsidian">{label}</span>}
        {description && <span className="mt-0.5 block text-sm text-mist-700">{description}</span>}
      </label>
      <span className="mt-0.5 inline-flex">{btn}</span>
    </div>
  );
}

/**
 * Pembungkus field: label + kontrol + hint/error/success.
 * label · hint · error (string) · success (string|true) · required · optional · htmlFor/id · labelAction
 * description: teks abu di bawah label (gaya "Upload Document" referensi)
 * Anak tunggal (Input/Select/Textarea/PasswordInput/DatePicker) otomatis diberi id, state & aria-*.
 */
export function Field({ label, description, hint, error, success, required, optional, id, htmlFor, className, labelAction, children }) {
  const autoId = useId();
  const fid = id || htmlFor || autoId;
  const msgId = `${fid}-msg`;
  const descId = `${fid}-desc`;
  const state = error ? 'error' : success ? 'success' : undefined;
  const msg = error || (typeof success === 'string' ? success : null) || hint;
  const describedBy = [description && descId, msg && msgId].filter(Boolean).join(' ') || undefined;
  const only = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const child = only
    ? cloneElement(only, {
        id: only.props.id || fid,
        state: only.props.state || state,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })
    : children;
  return (
    <div className={cn('flex flex-col', className)}>
      {(label || labelAction) && (
        <div className={cn('flex items-center justify-between gap-3', description ? 'mb-0.5' : 'mb-1.5')}>
          {label && (
            <label htmlFor={fid} className="text-sm font-medium text-obsidian">
              {label}
              {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
              {optional && <span className="ml-1.5 font-normal text-mist-500">(opsional)</span>}
            </label>
          )}
          {labelAction}
        </div>
      )}
      {description && (
        <p id={descId} className="mb-2 text-[13px] text-mist-700">
          {description}
        </p>
      )}
      {child}
      {msg && (
        <p
          id={msgId}
          role={error ? 'alert' : undefined}
          className={cn('mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug', error ? 'text-danger-700' : success && typeof success === 'string' ? 'text-mint-700' : 'text-mist-700')}
        >
          {error && <AlertCircle className="mt-px h-4 w-4 shrink-0 fill-danger text-white" aria-hidden />}
          {!error && typeof success === 'string' && <CheckCircle2 className="mt-px h-4 w-4 shrink-0" aria-hidden />}
          <span>{msg}</span>
        </p>
      )}
    </div>
  );
}
