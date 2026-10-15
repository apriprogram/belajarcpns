'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Popover } from './Popover';
import { renderIcon } from './_icon';
import { BOX_STATE, CONTROL_SIZES } from './_field';

export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/* ---------- utilitas tanggal (zona waktu lokal, tanpa jam) ---------- */

/** Terima Date atau string 'YYYY-MM-DD' / ISO → Date lokal tengah malam (atau null). */
export function toDateOnly(v) {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : new Date(v.getFullYear(), v.getMonth(), v.getDate());
  if (typeof v === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
const sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const monthStart = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonthsKeepDay = (d, n) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};
const pad = (n) => String(n).padStart(2, '0');
/** Date → 'YYYY-MM-DD' (lokal). */
export const toISODate = (d) => (d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : '');
/** Date → "7 November 2026" (opsi weekday → "Sabtu, 7 November 2026"). */
export function formatTanggalPanjang(d, { weekday = false } = {}) {
  if (!d) return '';
  const s = `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`;
  return weekday ? `${NAMA_HARI[d.getDay()]}, ${s}` : s;
}

/**
 * Kalender bulan (grid 7 kolom).
 * value (Date | 'YYYY-MM-DD' | null) + onChange(Date | null) · min · max · isDateDisabled(date) → bool
 * weekStartsOn: 1 (Senin, default) | 0 (Minggu) · month/defaultMonth + onMonthChange(Date) (bulan tampil)
 * markedDates: Date[] → titik kecil (mis. jadwal tryout) · showToday: tombol "Hari ini" · clearable: tombol "Hapus"
 * bordered: bungkus kartu putih · autoFocus: fokus tanggal aktif saat dipasang
 * Judul "April 2000" bisa diklik → grid tahun (gulir) → grid bulan → kembali ke tanggal (cepat untuk tanggal lahir).
 * defaultView: 'day' (default) | 'month' | 'year' — tampilan awal · yearPicker (default true): judul bisa diklik.
 * Keyboard: ← → ↑ ↓ (hari/minggu), Home/End (awal/akhir minggu), PageUp/PageDown (bulan, +Shift = tahun), Enter/Spasi.
 * Di grid bulan/tahun: ← → ↑ ↓ pindah sel, Enter/Spasi memilih.
 */
export function Calendar({
  value,
  onChange,
  min,
  max,
  isDateDisabled,
  weekStartsOn = 1,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  markedDates = [],
  showToday = false,
  clearable = false,
  footer,
  bordered = false,
  autoFocus = false,
  defaultView = 'day',
  yearPicker = true,
  ariaLabel = 'Kalender',
  className,
}) {
  const selected = toDateOnly(value);
  const minD = toDateOnly(min);
  const maxD = toDateOnly(max);
  const [today, setToday] = useState(null);
  const [innerMonth, setInnerMonth] = useState(() => monthStart(toDateOnly(defaultMonth) || selected || new Date()));
  const view = monthProp ? monthStart(toDateOnly(monthProp)) : innerMonth;
  const [focused, setFocused] = useState(() => selected || toDateOnly(new Date()));
  const [mode, setMode] = useState(yearPicker && ['month', 'year'].includes(defaultView) ? defaultView : 'day');
  const gridRef = useRef(null);
  const pickRef = useRef(null);
  const wantFocus = useRef(autoFocus && mode === 'day');
  const wantPickFocus = useRef(autoFocus && mode !== 'day');
  const titleId = useId();

  // "hari ini" dihitung di klien agar tidak beda dengan render server
  useEffect(() => setToday(toDateOnly(new Date())), []);

  const isDisabled = (d) => (minD && d < minD) || (maxD && d > maxD) || (isDateDisabled ? !!isDateDisabled(d) : false);

  const setView = (d) => {
    const m = monthStart(d);
    if (!monthProp) setInnerMonth(m);
    onMonthChange && onMonthChange(m);
  };

  // tanggal fokus selalu di bulan yang tampil
  const focusDay = focused && focused.getMonth() === view.getMonth() && focused.getFullYear() === view.getFullYear() ? focused : selected && selected.getMonth() === view.getMonth() && selected.getFullYear() === view.getFullYear() ? selected : view;

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    gridRef.current?.querySelector(`[data-date="${toISODate(focusDay)}"]`)?.focus();
  });

  const weeks = useMemo(() => {
    const first = view;
    const offset = (first.getDay() - weekStartsOn + 7) % 7;
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(first.getFullYear(), first.getMonth(), d));
    while (cells.length % 7) cells.push(null);
    const out = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [view, weekStartsOn]);

  const dayNames = Array.from({ length: 7 }, (_, i) => (i + weekStartsOn) % 7);
  const marked = (d) => markedDates.some((m) => sameDay(toDateOnly(m), d));

  const prevDisabled = minD && new Date(view.getFullYear(), view.getMonth(), 0) < minD;
  const nextDisabled = maxD && new Date(view.getFullYear(), view.getMonth() + 1, 1) > maxD;

  /* ---------- grid bulan / tahun ---------- */
  const baseYear = (today || view).getFullYear();
  // tanpa min/max: rentang tetap (±100/30 tahun dari tahun ini), diperluas bila bulan tampil di luarnya
  const fromYear = minD ? minD.getFullYear() : Math.min(view.getFullYear(), baseYear - 100);
  const toYear = maxD ? maxD.getFullYear() : Math.max(view.getFullYear(), baseYear + 30);
  const years = useMemo(() => Array.from({ length: Math.max(0, toYear - fromYear + 1) }, (_, i) => fromYear + i), [fromYear, toYear]);
  const monthOff = (y, m) => (minD && new Date(y, m + 1, 0) < minD) || (maxD && new Date(y, m, 1) > maxD);
  const clampMonth = (d) => (minD && d < monthStart(minD) ? monthStart(minD) : maxD && d > maxD ? monthStart(maxD) : d);

  useEffect(() => {
    if (!wantPickFocus.current || mode === 'day') return;
    wantPickFocus.current = false;
    const box = pickRef.current;
    if (!box) return;
    const el = box.querySelector('[data-active="true"]:not(:disabled)') || box.querySelector('button:not(:disabled)');
    if (!el) return;
    // gulir wadah (bukan halaman) agar sel aktif di tengah
    if (box.scrollHeight > box.clientHeight) box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2;
    el.focus({ preventScroll: true });
  });

  const switchMode = (m) => {
    setMode(m);
    if (m === 'day') wantFocus.current = true;
    else wantPickFocus.current = true;
  };

  const pickYear = (y) => {
    setView(clampMonth(new Date(y, view.getMonth(), 1)));
    switchMode('month');
  };

  const pickMonth = (m) => {
    const y = view.getFullYear();
    const last = new Date(y, m + 1, 0).getDate();
    const base = focused || selected || view;
    setView(new Date(y, m, 1));
    setFocused(new Date(y, m, Math.min(base.getDate(), last)));
    switchMode('day');
  };

  const onPickKeyDown = (e, cols) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key];
    if (!step) return;
    e.preventDefault();
    const btns = Array.from(pickRef.current?.querySelectorAll('button[data-idx]') || []);
    const cur = btns.indexOf(document.activeElement);
    let i = cur < 0 ? 0 : cur + step;
    while (i >= 0 && i < btns.length && btns[i].disabled) i += step > 0 ? 1 : -1;
    const el = btns[i];
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView?.({ block: 'nearest' });
    }
  };

  const titleText = mode === 'day' ? `${NAMA_BULAN[view.getMonth()]} ${view.getFullYear()}` : mode === 'month' ? String(view.getFullYear()) : 'Pilih tahun';
  const prevNav =
    mode === 'month'
      ? { disabled: view.getFullYear() - 1 < fromYear, label: 'Tahun sebelumnya', go: () => setView(clampMonth(new Date(view.getFullYear() - 1, view.getMonth(), 1))) }
      : { disabled: !!prevDisabled, label: 'Bulan sebelumnya', go: () => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1)) };
  const nextNav =
    mode === 'month'
      ? { disabled: view.getFullYear() + 1 > toYear, label: 'Tahun berikutnya', go: () => setView(clampMonth(new Date(view.getFullYear() + 1, view.getMonth(), 1))) }
      : { disabled: !!nextDisabled, label: 'Bulan berikutnya', go: () => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1)) };

  const moveFocus = (d) => {
    setFocused(d);
    if (d.getMonth() !== view.getMonth() || d.getFullYear() !== view.getFullYear()) setView(d);
    wantFocus.current = true;
  };

  const select = (d) => {
    if (!d || isDisabled(d)) return;
    setFocused(d);
    onChange && onChange(d);
  };

  const onKeyDown = (e) => {
    const d = focusDay;
    const dow = (d.getDay() - weekStartsOn + 7) % 7;
    const map = {
      ArrowLeft: () => addDays(d, -1),
      ArrowRight: () => addDays(d, 1),
      ArrowUp: () => addDays(d, -7),
      ArrowDown: () => addDays(d, 7),
      Home: () => addDays(d, -dow),
      End: () => addDays(d, 6 - dow),
      PageUp: () => addMonthsKeepDay(d, e.shiftKey ? -12 : -1),
      PageDown: () => addMonthsKeepDay(d, e.shiftKey ? 12 : 1),
    };
    if (map[e.key]) {
      e.preventDefault();
      moveFocus(map[e.key]());
    }
  };

  const navBtn =
    'flex h-8 w-8 items-center justify-center rounded-full text-obsidian ring-1 ring-inset ring-mist-100 transition-colors hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:pointer-events-none disabled:opacity-40';

  return (
    <div role="group" aria-label={ariaLabel} className={cn('w-full min-w-[280px] select-none', bordered && 'rounded-[20px] bg-white p-4 ring-1 ring-inset ring-mist-100', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        {mode === 'year' ? (
          <span className="h-8 w-8" aria-hidden />
        ) : (
          <button type="button" className={navBtn} onClick={prevNav.go} disabled={prevNav.disabled} aria-label={prevNav.label}>
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {yearPicker ? (
          <button
            type="button"
            onClick={() => switchMode(mode === 'day' ? 'year' : mode === 'month' ? 'year' : 'day')}
            aria-label={mode === 'year' ? 'Kembali ke tanggal' : mode === 'month' ? `Pilih tahun, saat ini ${view.getFullYear()}` : `Pilih bulan dan tahun, saat ini ${titleText}`}
            className="group inline-flex h-8 items-center gap-1 rounded-full px-3 text-[15px] font-semibold tracking-tight text-obsidian transition-colors hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          >
            <span id={titleId} aria-live="polite">
              {titleText}
            </span>
            <ChevronDown className={cn('h-4 w-4 text-mist-700 transition-transform', mode !== 'day' && 'rotate-180')} aria-hidden />
          </button>
        ) : (
          <p id={titleId} className="text-[15px] font-semibold tracking-tight text-obsidian" aria-live="polite">
            {titleText}
          </p>
        )}
        {mode === 'year' ? (
          <span className="h-8 w-8" aria-hidden />
        ) : (
          <button type="button" className={navBtn} onClick={nextNav.go} disabled={nextNav.disabled} aria-label={nextNav.label}>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {mode === 'year' && (
        <div ref={pickRef} role="listbox" aria-label="Pilih tahun" onKeyDown={(e) => onPickKeyDown(e, 4)} className="relative grid max-h-[272px] grid-cols-4 gap-1 overflow-y-auto overscroll-contain border-t border-mist-100 pt-2">
          {years.map((y, i) => {
            const isSel = selected && selected.getFullYear() === y;
            const isView = view.getFullYear() === y;
            const isNow = today && today.getFullYear() === y;
            return (
              <button
                key={y}
                type="button"
                role="option"
                aria-selected={!!isSel}
                data-idx={i}
                data-active={isView}
                tabIndex={isView ? 0 : -1}
                onClick={() => pickYear(y)}
                className={cn(
                  'flex h-10 items-center justify-center rounded-xl text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-1',
                  isSel ? 'bg-cobalt font-semibold text-white hover:bg-cobalt-600' : isView ? 'font-semibold text-obsidian ring-1 ring-inset ring-mist-100 hover:bg-ghost' : isNow ? 'font-bold text-cobalt hover:bg-cobalt-50' : 'font-medium text-obsidian hover:bg-ghost',
                )}
              >
                {y}
              </button>
            );
          })}
        </div>
      )}

      {mode === 'month' && (
        <div ref={pickRef} role="listbox" aria-label={`Pilih bulan tahun ${view.getFullYear()}`} onKeyDown={(e) => onPickKeyDown(e, 3)} className="grid grid-cols-3 gap-1.5 border-t border-mist-100 pt-3">
          {BULAN_SINGKAT.map((nm, m) => {
            const y = view.getFullYear();
            const off = monthOff(y, m);
            const isSel = selected && selected.getFullYear() === y && selected.getMonth() === m;
            const isView = view.getMonth() === m;
            const isNow = today && today.getFullYear() === y && today.getMonth() === m;
            return (
              <button
                key={m}
                type="button"
                role="option"
                aria-selected={!!isSel}
                aria-label={`${NAMA_BULAN[m]} ${y}`}
                data-idx={m}
                data-active={isView}
                tabIndex={isView ? 0 : -1}
                disabled={!!off}
                onClick={() => pickMonth(m)}
                className={cn(
                  'flex h-14 items-center justify-center rounded-xl text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-1',
                  isSel ? 'bg-cobalt font-semibold text-white hover:bg-cobalt-600' : isView ? 'font-semibold text-obsidian ring-1 ring-inset ring-mist-100 hover:bg-ghost' : isNow ? 'font-bold text-cobalt hover:bg-cobalt-50' : 'font-medium text-obsidian hover:bg-ghost',
                  off && 'cursor-not-allowed !font-normal !text-mist hover:bg-transparent',
                )}
              >
                {nm}
              </button>
            );
          })}
        </div>
      )}

      <div ref={gridRef} role="grid" aria-labelledby={titleId} onKeyDown={onKeyDown} className={cn('border-t border-mist-100 pt-2', mode !== 'day' && 'hidden')}>
        <div role="row" className="grid grid-cols-7">
          {dayNames.map((i) => (
            <span key={i} role="columnheader" aria-label={NAMA_HARI[i]} className="flex h-8 items-center justify-center text-xs font-medium text-mist-500">
              {HARI_SINGKAT[i]}
            </span>
          ))}
        </div>
        {weeks.map((w, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7 gap-y-0.5">
            {w.map((d, di) => {
              if (!d) return <span key={`e${di}`} role="gridcell" className="h-10" />;
              const isSel = sameDay(d, selected);
              const isToday = sameDay(d, today);
              const dis = isDisabled(d);
              const isFocus = sameDay(d, focusDay);
              return (
                <span key={di} role="gridcell" aria-selected={isSel} className="flex h-10 items-center justify-center">
                  <button
                    type="button"
                    data-date={toISODate(d)}
                    tabIndex={isFocus ? 0 : -1}
                    disabled={dis}
                    aria-current={isToday ? 'date' : undefined}
                    aria-label={formatTanggalPanjang(d, { weekday: true })}
                    onClick={() => select(d)}
                    onFocus={() => !isFocus && setFocused(d)}
                    className={cn(
                      'relative flex h-9 w-9 items-center justify-center rounded-xl text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-1',
                      isSel ? 'bg-cobalt font-semibold text-white hover:bg-cobalt-600' : isToday ? 'font-bold text-cobalt hover:bg-cobalt-50' : 'font-medium text-obsidian hover:bg-ghost',
                      dis && 'cursor-not-allowed !font-normal !text-mist hover:bg-transparent',
                    )}
                  >
                    {d.getDate()}
                    {marked(d) && <span className={cn('absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full', isSel ? 'bg-white' : 'bg-cobalt')} aria-hidden />}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {(showToday || clearable || footer) && (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-mist-100 pt-3">
          {showToday ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const t = toDateOnly(new Date());
                setView(t);
                setMode('day');
                if (!isDisabled(t)) select(t);
              }}
            >
              Hari ini
            </Button>
          ) : (
            <span />
          )}
          {footer}
          {clearable && (
            <Button variant="soft" size="sm" onClick={() => onChange && onChange(null)} disabled={!selected}>
              Hapus
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Pemilih tanggal: pemicu "field berlabel di dalam" (ikon + label kecil + nilai) + Calendar di popover.
 * label ("Tanggal") · value + onChange(Date | null) · placeholder · min · max · isDateDisabled · weekStartsOn
 * clearable (default true) · showToday · disabled · state/invalid · icon · name (input hidden 'YYYY-MM-DD')
 * weekday: tampilkan nama hari · align: 'start' | 'end' · markedDates
 * size: kosong (default, label di dalam, tinggi 56) | 'sm' | 'md' | 'lg' → pemicu ringkas satu baris setinggi Input (label hanya untuk aria)
 * defaultView: tampilan awal kalender saat nilai kosong ('day' | 'month' | 'year'; mis. 'year' untuk tanggal lahir)
 * Di dalam <Field>, id/state/aria-describedby terisi otomatis. Escape / klik di luar menutup popover.
 */
export function DatePicker({
  label = 'Tanggal',
  value,
  onChange,
  placeholder = 'Pilih tanggal',
  min,
  max,
  isDateDisabled,
  weekStartsOn,
  markedDates,
  clearable = true,
  showToday = true,
  disabled,
  state,
  invalid,
  icon,
  name,
  weekday = false,
  align = 'start',
  size,
  defaultView = 'day',
  id,
  className,
  ref,
  ...props
}) {
  const [open, setOpen] = useState(false);
  const st = invalid ? 'error' : state || 'default';
  const d = toDateOnly(value);
  const text = d ? formatTanggalPanjang(d, { weekday }) : '';
  const autoId = useId();
  const bid = id || autoId;
  const compact = !!CONTROL_SIZES[size];
  return (
    <>
      <Popover
        open={open}
        onOpenChange={setOpen}
        align={align}
        ariaLabel={`Pilih ${typeof label === 'string' ? label.toLowerCase() : 'tanggal'}`}
        className="w-[320px] max-w-[calc(100vw-16px)] p-4"
        trigger={
          <button
            ref={ref}
            id={bid}
            type="button"
            disabled={disabled}
            aria-invalid={st === 'error' || undefined}
            aria-label={`${typeof label === 'string' ? label : 'Tanggal'}: ${text || placeholder}`}
            className={cn(
              'group flex w-full items-center rounded-xl border bg-white text-left transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:border-cobalt focus-visible:ring-1 focus-visible:ring-cobalt aria-expanded:border-cobalt aria-expanded:ring-1 aria-expanded:ring-cobalt disabled:cursor-not-allowed disabled:bg-mist-50',
              compact ? cn(CONTROL_SIZES[size], 'gap-2 px-3.5') : 'min-h-14 gap-3 px-4 py-2',
              BOX_STATE[st],
              className,
            )}
            {...props}
          >
            <span className={cn('shrink-0 transition-colors group-aria-expanded:text-cobalt', compact ? 'text-mist-500' : 'text-obsidian-600')}>{renderIcon(icon || <CalendarDays />, compact ? 'h-[18px] w-[18px]' : 'h-5 w-5')}</span>
            {compact ? (
              <span className={cn('min-w-0 flex-1 truncate', size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-[15px]', d ? 'text-obsidian' : 'text-mist-500')}>{text || placeholder}</span>
            ) : (
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs leading-4 text-mist-700">{label}</span>
                <span className={cn('truncate text-[15px] leading-6', d ? 'font-medium text-obsidian' : 'text-mist-500')}>{text || placeholder}</span>
              </span>
            )}
            {clearable && d && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Hapus tanggal"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange && onChange(null);
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
          <Calendar
            value={d}
            onChange={(v) => {
              onChange && onChange(v);
              close();
            }}
            min={min}
            max={max}
            isDateDisabled={isDateDisabled}
            weekStartsOn={weekStartsOn}
            markedDates={markedDates}
            clearable={clearable}
            showToday={showToday}
            defaultView={d ? 'day' : defaultView}
            autoFocus
          />
        )}
      </Popover>
      {name && <input type="hidden" name={name} value={toISODate(d)} />}
    </>
  );
}

export default Calendar;
