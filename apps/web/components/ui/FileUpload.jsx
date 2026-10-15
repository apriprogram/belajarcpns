'use client';

import { useId, useRef, useState } from 'react';
import { AlertCircle, CloudUpload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

/** Ukuran byte → "1,2 MB" / "820 KB". */
export function formatUkuranFile(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Cocokkan file dengan atribut accept ('.csv,.xlsx', 'image/*', 'application/pdf'). */
function matchesAccept(file, accept) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accept
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith('.') ? name.endsWith(a) : a.endsWith('/*') ? type.startsWith(a.slice(0, -1)) : type === a));
}

/** Teks format otomatis dari accept: '.csv,.xlsx' → "CSV, XLSX". */
function acceptLabel(accept) {
  if (!accept) return '';
  return accept
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => (a.startsWith('.') ? a.slice(1).toUpperCase() : a.endsWith('/*') ? (a.startsWith('image') ? 'Gambar' : a.replace('/*', '')) : a.split('/').pop().toUpperCase()))
    .join(', ');
}

/**
 * Upload file: dropzone putus-putus (seret & lepas atau klik) + daftar file terpilih.
 * accept ('.csv,.xlsx' / 'image/*') · multiple · maxSize (MB) · maxFiles · disabled
 * onFiles(files: File[]) dipanggil setiap daftar berubah (tambah/hapus)
 * files: daftar terkontrol (opsional) · title · hint (default dari accept & maxSize) · buttonText
 * error: pesan error eksternal · name/id untuk <input type="file"> · compact: dropzone lebih pendek
 */
export function FileUpload({
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  onFiles,
  files: filesProp,
  disabled,
  title = 'Pilih file atau seret ke sini',
  hint,
  buttonText = 'Pilih file',
  error: errorProp,
  name,
  id,
  compact = false,
  className,
}) {
  const [inner, setInner] = useState([]);
  const files = filesProp !== undefined ? filesProp : inner;
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const autoId = useId();
  const iid = id || autoId;

  const commit = (next) => {
    if (filesProp === undefined) setInner(next);
    onFiles && onFiles(next);
  };

  const add = (list) => {
    if (disabled) return;
    const incoming = Array.from(list || []);
    if (!incoming.length) return;
    const errs = [];
    const ok = incoming.filter((f) => {
      if (!matchesAccept(f, accept)) {
        errs.push(`Format file "${f.name}" tidak didukung.`);
        return false;
      }
      if (maxSize && f.size > maxSize * 1024 * 1024) {
        errs.push(`Ukuran "${f.name}" melebihi batas ${maxSize} MB.`);
        return false;
      }
      return true;
    });
    let next = multiple ? [...files, ...ok.filter((f) => !files.some((x) => x.name === f.name && x.size === f.size))] : ok.slice(0, 1);
    if (!multiple && ok.length > 1) errs.push('Hanya satu file yang dapat dipilih.');
    if (maxFiles && next.length > maxFiles) {
      errs.push(`Maksimal ${maxFiles} file.`);
      next = next.slice(0, maxFiles);
    }
    setError(errs.join(' '));
    if (ok.length) commit(next);
  };

  const remove = (idx) => {
    setError('');
    commit(files.filter((_, i) => i !== idx));
  };

  const autoHint = [acceptLabel(accept), maxSize ? `Maks. ${maxSize} MB` : null].filter(Boolean).join(' · ');
  const msg = errorProp || error;

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        onClick={(e) => {
          if (disabled || e.target === inputRef.current || e.target.closest('button')) return;
          inputRef.current?.click();
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition-colors',
          compact ? 'py-6' : 'py-10',
          drag ? 'border-cobalt bg-cobalt-50/60' : msg ? 'border-danger/50 bg-danger-50/40' : 'border-mist bg-mist-50 hover:border-mist-500',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <CloudUpload className={cn('mb-3 h-9 w-9', drag ? 'text-cobalt' : 'text-mist-500')} strokeWidth={1.75} aria-hidden />
        <p className="text-sm font-semibold text-obsidian">{drag ? 'Lepaskan file di sini' : title}</p>
        {(hint || autoHint) && <p className="mt-1 text-[13px] text-mist-700">{hint || autoHint}</p>}
        <Button variant="secondary" size="sm" className="mt-4" disabled={disabled} onClick={() => inputRef.current?.click()} aria-describedby={msg ? `${iid}-err` : undefined}>
          {buttonText}
        </Button>
        <input
          ref={inputRef}
          id={iid}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {msg && (
        <p id={`${iid}-err`} role="alert" className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-danger-700">
          <AlertCircle className="mt-px h-4 w-4 shrink-0 fill-danger text-white" aria-hidden />
          <span>{msg}</span>
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="File terpilih">
          {files.map((f, i) => (
            <li key={`${f.name}-${f.size}-${i}`} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-inset ring-mist-100">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ghost text-obsidian-600">
                <FileText className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-obsidian">{f.name}</span>
                <span className="block text-xs text-mist-700">{formatUkuranFile(f.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={disabled}
                aria-label={`Hapus ${f.name}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mist-700 transition-colors hover:bg-danger-50 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FileUpload;
