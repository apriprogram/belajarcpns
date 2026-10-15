'use client';

import { useId, useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Calendar, formatTanggalPanjang, toDateOnly, toISODate } from './Calendar';
import { Popover } from './Popover';
import { TimeList } from './TimeList';
import { BOX_STATE, CONTROL_SIZES } from './_field';

/** 'YYYY-MM-DDTHH:mm' → { date: Date|null, time: 'HH:mm'|'' } */
function parse(v) {
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/.exec(String(v || ''));
  return m ? { date: toDateOnly(m[1]), time: m[2] || '' } : { date: null, time: '' };
}

/**
 * Pemilih tanggal + jam bergaya DatePicker (Calendar + TimeList dalam satu popover).
 * value / onChange memakai string 'YYYY-MM-DDTHH:mm' (format sama dengan input datetime-local; kosong = '').
 * label (aria) · placeholder · min (Date | 'YYYY-MM-DD') · max · step (menit, default 15) · defaultTime ('08:00')
 * suffix ('WIB') · clearable · disabled · state/invalid · size ('md' default, satu baris setinggi Input) · align.
 */
export function DateTimeField({
  label = 'Tanggal & jam',
  value,
  onChange,
  placeholder = 'Pilih tanggal & jam',
  min,
  max,
  step = 15,
  defaultTime = '08:00',
  suffix = 'WIB',
  clearable = true,
  disabled,
  state,
  invalid,
  size = 'md',
  align = 'start',
  id,
  className,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const { date, time } = parse(value);
  const st = invalid ? 'error' : state || 'default';
  const autoId = useId();
  const text = date ? `${formatTanggalPanjang(date, { weekday: true })} · ${(time || defaultTime).replace(':', '.')} ${suffix}`.trim() : '';
  const emit = (d, t) => onChange && onChange(d ? `${toISODate(d)}T${t || defaultTime}` : '');

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align={align}
      ariaLabel={`Pilih ${typeof label === 'string' ? label.toLowerCase() : 'tanggal dan jam'}`}
      className="w-[min(520px,calc(100vw-16px))] p-4"
      trigger={
        <button
          id={id || autoId}
          type="button"
          disabled={disabled}
          aria-invalid={st === 'error' || undefined}
          aria-label={`${typeof label === 'string' ? label : 'Tanggal & jam'}: ${text || placeholder}`}
          className={cn(
            'group flex w-full items-center gap-2 rounded-xl border bg-white px-3.5 text-left transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:border-cobalt focus-visible:ring-1 focus-visible:ring-cobalt aria-expanded:border-cobalt aria-expanded:ring-1 aria-expanded:ring-cobalt disabled:cursor-not-allowed disabled:bg-mist-50',
            CONTROL_SIZES[size] || CONTROL_SIZES.md,
            BOX_STATE[st],
            className,
          )}
          {...props}
        >
          <CalendarClock className="h-[18px] w-[18px] shrink-0 text-mist-500 transition-colors group-aria-expanded:text-cobalt" aria-hidden />
          <span className={cn('min-w-0 flex-1 truncate text-[15px]', date ? 'text-obsidian' : 'text-mist-500')}>{text || placeholder}</span>
          {clearable && date && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Kosongkan jadwal"
              onClick={(e) => {
                e.stopPropagation();
                onChange && onChange('');
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-mist-500 hover:bg-ghost hover:text-obsidian"
            >
              <X className="h-4 w-4" aria-hidden />
            </span>
          )}
        </button>
      }
    >
      {({ close }) => (
        <div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Calendar value={date} onChange={(d) => emit(d, time)} min={min} max={max} showToday autoFocus className="min-w-0 flex-1" />
            <div className="sm:w-[132px] sm:border-l sm:border-mist-100 sm:pl-4">
              <p className="mb-2 text-xs font-medium text-mist-700">Jam ({suffix})</p>
              <TimeList
                value={time || (date ? defaultTime : '')}
                onChange={(t) => emit(date || toDateOnly(new Date()), t)}
                start="00:00"
                end="23:45"
                step={step}
                maxHeight={292}
                ariaLabel="Pilih jam"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-mist-100 pt-3">
            <p className="truncate text-sm text-mist-700">{text || 'Belum diatur'}</p>
            <div className="flex shrink-0 gap-2">
              {clearable && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onChange && onChange('');
                    close();
                  }}
                >
                  Kosongkan
                </Button>
              )}
              <Button size="sm" variant="accent" onClick={close}>
                Selesai
              </Button>
            </div>
          </div>
        </div>
      )}
    </Popover>
  );
}

export default DateTimeField;
