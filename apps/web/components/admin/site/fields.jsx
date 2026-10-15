'use client';

/* eslint-disable @next/next/no-img-element */
import { createContext, useContext, useId, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, FileVideo, ImageIcon, Plus, Trash2, UploadCloud, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Button, Field, IconButton, Input, Spinner, Switch, Textarea } from '@/components/ui';
import { getIn, moveItem, pathKey } from './utils';

/**
 * Konteks editor: { site, set(path, value), errors } — dipakai semua field agar tiap editor grup
 * cukup menyebut path-nya saja.
 */
const EditorCtx = createContext(null);
export const EditorProvider = EditorCtx.Provider;

export function useEditor() {
  const ctx = useContext(EditorCtx);
  if (!ctx) throw new Error('useEditor harus di dalam EditorProvider');
  return ctx;
}

/** Ambil nilai + setter untuk satu path. */
export function useValue(path, fallback) {
  const { site, set, errors } = useEditor();
  return [getIn(site, path, fallback), (v) => set(path, v), errors[pathKey(path)]];
}

/* ------------------------------------------------------------------ */
/* Pembungkus blok                                                      */
/* ------------------------------------------------------------------ */

/** Blok berjudul di dalam editor grup (datar, latar ghost tipis). */
export function Block({ title, description, action, className, children }) {
  return (
    <section className={cn('rounded-2xl ring-1 ring-inset ring-mist-100 p-4 sm:p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-obsidian">{title}</h3>}
            {description && <p className="mt-0.5 text-[13px] leading-relaxed text-mist-700">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Grid({ cols = 2, className, children }) {
  return <div className={cn('grid gap-4', cols === 2 && 'sm:grid-cols-2', cols === 3 && 'sm:grid-cols-3', cols === 4 && 'grid-cols-2 sm:grid-cols-4', className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Field dasar                                                          */
/* ------------------------------------------------------------------ */

export function TextField({ path, label, hint, placeholder, maxLength, required, mono, className }) {
  const [value, setValue, error] = useValue(path, '');
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      <Input value={value ?? ''} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} maxLength={maxLength} mono={mono} />
    </Field>
  );
}

export function AreaField({ path, label, hint, placeholder, rows = 3, className }) {
  const [value, setValue, error] = useValue(path, '');
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <Textarea value={value ?? ''} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} rows={rows} className="min-h-[72px]" />
    </Field>
  );
}

export function NumberField({ path, label, hint, min = 0, max, className }) {
  const [value, setValue, error] = useValue(path, 0);
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value === null || value === undefined ? '' : value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return setValue(0);
          const n = Number(raw);
          if (!Number.isNaN(n)) setValue(n);
        }}
        className="tabular-nums"
      />
    </Field>
  );
}

export function SwitchField({ path, label, description, fallback = true }) {
  const [value, setValue] = useValue(path, fallback);
  return <Switch checked={value !== false} onChange={setValue} label={label} description={description} />;
}

/* ------------------------------------------------------------------ */
/* Tombol urut/hapus                                                    */
/* ------------------------------------------------------------------ */

export function RowActions({ index, length, onMove, onRemove, removeDisabled, label = 'item' }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      {onMove && (
        <>
          <IconButton icon={<ArrowUp />} label={`Naikkan ${label}`} size="xs" variant="ghost" shape="rounded" disabled={index === 0} onClick={() => onMove(index, index - 1)} />
          <IconButton icon={<ArrowDown />} label={`Turunkan ${label}`} size="xs" variant="ghost" shape="rounded" disabled={index === length - 1} onClick={() => onMove(index, index + 1)} />
        </>
      )}
      {onRemove && <IconButton icon={<Trash2 />} label={`Hapus ${label}`} size="xs" variant="ghost" shape="rounded" disabled={removeDisabled} onClick={() => onRemove(index)} className="hover:!text-danger" />}
    </div>
  );
}

/**
 * Editor daftar objek generik. renderItem(itemPath, index) → field. newItem() untuk "Tambah".
 * min/max membatasi jumlah. itemTitle(item, i) judul baris.
 */
export function ListEditor({ path, itemTitle, renderItem, newItem, addLabel = 'Tambah', min = 0, max = Infinity, reorder = true, label = 'item', emptyText = 'Belum ada item.' }) {
  const [list, setList] = useValue(path, []);
  const items = Array.isArray(list) ? list : [];
  const move = (from, to) => setList(moveItem(items, from, to));
  const remove = (i) => setList(items.filter((_, j) => j !== i));
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="rounded-xl bg-ghost px-4 py-3 text-[13px] text-mist-700">{emptyText}</p>}
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl bg-ghost/60 p-3 ring-1 ring-inset ring-mist-100 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="min-w-0 truncate text-[13px] font-semibold text-obsidian">
              <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1 text-[11px] font-semibold tabular-nums text-mist-700 ring-1 ring-inset ring-mist-100">{i + 1}</span>
              {(itemTitle && itemTitle(item, i)) || `${label[0].toUpperCase()}${label.slice(1)} ${i + 1}`}
            </p>
            <RowActions index={i} length={items.length} onMove={reorder ? move : null} onRemove={remove} removeDisabled={items.length <= min} label={label} />
          </div>
          <div className="space-y-4">{renderItem([...path, i], i)}</div>
        </div>
      ))}
      {newItem && items.length < max && (
        <Button variant="soft" size="sm" icon={<Plus />} onClick={() => setList([...items, newItem()])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}

/** Daftar teks sederhana (mis. poin hero) — satu input per baris. */
export function StringListEditor({ path, label, placeholder, addLabel = 'Tambah poin', max = 10 }) {
  const [list, setList] = useValue(path, []);
  const items = Array.isArray(list) ? list : [];
  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-medium text-obsidian">{label}</p>}
      <div className="space-y-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input size="sm" value={v ?? ''} placeholder={placeholder} aria-label={`${label || 'Poin'} ${i + 1}`} onChange={(e) => setList(items.map((x, j) => (j === i ? e.target.value : x)))} wrapperClassName="flex-1" />
            <RowActions index={i} length={items.length} onMove={(a, b) => setList(moveItem(items, a, b))} onRemove={(k) => setList(items.filter((_, j) => j !== k))} label="poin" />
          </div>
        ))}
      </div>
      {items.length < max && (
        <Button variant="link" size="sm" icon={<Plus />} className="mt-2" onClick={() => setList([...items, ''])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}

/** Input chip: ketik lalu Enter/koma untuk menambah; klik × untuk menghapus. */
export function ChipsInput({ path, label, hint, placeholder = 'Ketik lalu Enter' }) {
  const [list, setList] = useValue(path, []);
  const items = Array.isArray(list) ? list : [];
  const [text, setText] = useState('');
  const id = useId();
  const add = () => {
    const parts = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s) => !items.includes(s));
    if (parts.length) setList([...items, ...parts]);
    setText('');
  };
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-obsidian">
          {label}
        </label>
      )}
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl bg-white px-2 py-1.5 ring-1 ring-inset ring-mist-100 focus-within:ring-2 focus-within:ring-cobalt">
        {items.map((t, i) => (
          <span key={`${t}-${i}`} className="inline-flex h-7 items-center gap-1 rounded-full bg-ghost pl-2.5 pr-1 text-[13px] font-medium text-obsidian">
            {t}
            <button
              type="button"
              onClick={() => setList(items.filter((_, j) => j !== i))}
              className="flex h-5 w-5 items-center justify-center rounded-full text-mist-700 hover:bg-mist-100 hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
              aria-label={`Hapus ${t}`}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            } else if (e.key === 'Backspace' && !text && items.length) {
              setList(items.slice(0, -1));
            }
          }}
          onBlur={() => text.trim() && add()}
          placeholder={items.length ? '' : placeholder}
          className="h-7 min-w-[120px] flex-1 bg-transparent px-1 text-sm text-obsidian outline-none placeholder:text-mist-500"
        />
      </div>
      {hint && <p className="mt-1.5 text-[13px] text-mist-700">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Unggah media                                                         */
/* ------------------------------------------------------------------ */

const LIMITS = {
  image: { max: 5 * 1024 * 1024, accept: 'image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon,.ico', label: 'PNG, JPG, WEBP, GIF, ICO · maks 5 MB' },
  video: { max: 50 * 1024 * 1024, accept: 'video/mp4,video/webm', label: 'MP4 atau WEBM · maks 50 MB' },
};

function checkFile(file, kind) {
  const isVideo = /^video\//.test(file.type) || /\.(mp4|webm)$/i.test(file.name);
  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
  if (isSvg) return 'File SVG tidak diizinkan.';
  if (kind === 'video' && !isVideo) return 'Pilih file video MP4 atau WEBM.';
  if (kind === 'image' && isVideo) return 'Pilih file gambar.';
  const lim = LIMITS[kind];
  if (file.size > lim.max) return `Ukuran file melebihi ${Math.round(lim.max / 1024 / 1024)} MB.`;
  return null;
}

/**
 * Field media: pratinjau + unggah ke /api/admin/site/upload + hapus + URL manual.
 * kind: 'image' | 'video' · square: pratinjau kotak (logo) · nullable: hapus → null (selain itu '').
 */
export function MediaField({ path, label, hint, kind = 'image', square, nullable, className }) {
  const [value, setValue, error] = useValue(path, '');
  const { setUploading } = useEditor();
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const id = useId();
  const lim = LIMITS[kind];

  const upload = async (file) => {
    if (!file) return;
    const bad = checkFile(file, kind);
    if (bad) {
      setUploadError(bad);
      return;
    }
    setUploadError('');
    setBusy(true);
    setUploading?.((n) => n + 1);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.upload('/admin/site/upload', fd);
      if (!res || !res.url) throw new Error('Respons unggahan tidak valid.');
      setValue(res.url);
    } catch (err) {
      setUploadError(errorMessage(err, 'Gagal mengunggah file.'));
    } finally {
      setBusy(false);
      setUploading?.((n) => Math.max(0, n - 1));
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const hasValue = typeof value === 'string' && value.trim() !== '';
  const Icon = kind === 'video' ? FileVideo : ImageIcon;

  return (
    <div className={cn('min-w-0', className)}>
      {label && <p className="mb-1.5 text-sm font-medium text-obsidian">{label}</p>}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          upload(e.dataTransfer.files && e.dataTransfer.files[0]);
        }}
        className={cn('flex items-center gap-3 rounded-2xl p-2.5 ring-1 ring-inset transition-colors', drag ? 'bg-cobalt-50 ring-cobalt' : 'bg-white ring-mist-100', error && 'ring-danger')}
      >
        <div className={cn('relative flex shrink-0 items-center justify-center overflow-hidden bg-ghost', square ? 'h-14 w-14 rounded-xl' : 'h-14 w-24 rounded-xl')}>
          {hasValue && kind === 'image' && <img src={value} alt="" className="h-full w-full object-cover" />}
          {hasValue && kind === 'video' && <video src={value} className="h-full w-full object-cover" muted playsInline preload="metadata" />}
          {!hasValue && <Icon className="h-5 w-5 text-mist-500" strokeWidth={1.75} aria-hidden />}
          {busy && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/75">
              <Spinner size="sm" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-obsidian">{busy ? 'Mengunggah…' : hasValue ? value.split('/').pop() : 'Belum ada file'}</p>
          <p className="truncate text-xs text-mist-700">{lim.label}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <input ref={inputRef} id={id} type="file" accept={lim.accept} className="sr-only" onChange={(e) => upload(e.target.files && e.target.files[0])} />
          <Button variant="secondary" size="sm" icon={<UploadCloud />} loading={busy} onClick={() => inputRef.current && inputRef.current.click()}>
            <span className="hidden sm:inline">{hasValue ? 'Ganti' : 'Unggah'}</span>
          </Button>
          {hasValue && <IconButton icon={<Trash2 />} label="Hapus file" size="sm" variant="ghost" shape="rounded" disabled={busy} onClick={() => setValue(nullable ? null : '')} />}
        </div>
      </div>
      <Input
        size="sm"
        value={value ?? ''}
        onChange={(e) => setValue(nullable && e.target.value === '' ? null : e.target.value)}
        placeholder="atau tempel URL, mis. /uploads/site/…"
        aria-label={`URL ${label || 'media'}`}
        invalid={!!error}
        wrapperClassName="mt-2"
        className="text-[13px]"
      />
      {(uploadError || error || hint) && (
        <p role={uploadError || error ? 'alert' : undefined} className={cn('mt-1.5 text-[13px]', uploadError || error ? 'text-danger-700' : 'text-mist-700')}>
          {uploadError || error || hint}
        </p>
      )}
    </div>
  );
}
