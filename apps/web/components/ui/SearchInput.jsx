'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Kolom pencarian dengan tombol hapus & debounce (Style UI v2: putih, garis mist-100, tanpa shadow).
 * value + onChange(value) (langsung, tiap ketik)
 * onSearch(value): dipanggil setelah debounce ms (default 350) — cocok untuk fetch
 * placeholder ("Cari…") · size: sm (36) | md (44) · shape: 'rounded' (default) | 'pill'
 * shortcut: tampilkan "/" dan fokus saat menekan "/"
 * kbd: petunjuk pintasan, mis. "⌘K" → fokus dengan Ctrl/⌘ + K (huruf terakhir kbd)
 */
export function SearchInput({ value: valueProp, defaultValue = '', onChange, onSearch, debounce = 350, placeholder = 'Cari…', size = 'md', shape = 'rounded', shortcut, kbd, className, inputClassName, ariaLabel, ...props }) {
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp !== undefined ? valueProp : inner;
  const first = useRef(true);
  const inputRef = useRef(null);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return undefined;
    }
    if (!onSearchRef.current) return undefined;
    const t = setTimeout(() => onSearchRef.current(value), debounce);
    return () => clearTimeout(t);
  }, [value, debounce]);

  useEffect(() => {
    if (!shortcut && !kbd) return undefined;
    const key = kbd ? String(kbd).trim().slice(-1).toLowerCase() : null;
    const onKey = (e) => {
      if (key && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (shortcut && e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '') && !document.activeElement?.isContentEditable) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcut, kbd]);

  const set = (v) => {
    if (valueProp === undefined) setInner(v);
    onChange && onChange(v);
  };

  const hint = kbd || (shortcut ? '/' : null);

  return (
    <div className={cn('group relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-mist-500 transition-colors group-focus-within:text-cobalt" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        aria-label={ariaLabel || placeholder}
        aria-keyshortcuts={kbd ? 'Control+K Meta+K' : shortcut ? '/' : undefined}
        value={value}
        onChange={(e) => set(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            e.stopPropagation();
            set('');
          }
          if (e.key === 'Enter' && onSearchRef.current) onSearchRef.current(value);
        }}
        placeholder={placeholder}
        className={cn(
          'w-full border border-mist-100 bg-white pl-10 text-sm text-obsidian outline-none transition-[border-color,box-shadow] placeholder:text-mist-500 hover:border-mist focus:border-cobalt focus:ring-1 focus:ring-cobalt focus-visible:outline-none [&::-webkit-search-cancel-button]:appearance-none',
          shape === 'pill' ? 'rounded-full' : 'rounded-xl',
          size === 'sm' ? 'h-9' : 'h-11',
          hint && !value ? (kbd ? 'pr-14' : 'pr-10') : 'pr-10',
          inputClassName,
        )}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            set('');
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-mist-700 hover:bg-ghost hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          aria-label="Hapus pencarian"
        >
          <X className="h-4 w-4" />
        </button>
      ) : (
        hint && (
          <kbd className="pointer-events-none absolute right-2.5 max-sm:hidden top-1/2 -translate-y-1/2 rounded-md bg-ghost px-1.5 py-0.5 font-sans text-[11px] font-semibold text-obsidian-600 ring-1 ring-inset ring-mist-100">{hint}</kbd>
        )
      )}
    </div>
  );
}

export default SearchInput;
