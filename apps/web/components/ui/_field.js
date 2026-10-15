// Kelas bersama untuk kontrol form (Input, Select, Textarea, DatePicker, SearchInput) — Style UI v2.

/** Permukaan kontrol: putih, garis 1px mist-100, transisi halus. */
export const CONTROL_BASE =
  'w-full bg-white text-[15px] text-obsidian placeholder:text-mist-500 border outline-none focus-visible:outline-none ' +
  'transition-[border-color,box-shadow,background-color] duration-150 ' +
  'disabled:cursor-not-allowed disabled:border-mist-100 disabled:bg-mist-50 disabled:text-mist-500 disabled:placeholder:text-mist';

/** State garis. Fokus = border cobalt + ring 1px → tampak 2px cobalt (seperti 123done). */
export const CONTROL_STATE = {
  default: 'border-mist-100 hover:border-mist focus:border-cobalt focus:ring-1 focus:ring-cobalt',
  success: 'border-mist-100 hover:border-mist focus:border-cobalt focus:ring-1 focus:ring-cobalt',
  error: 'border-danger ring-1 ring-danger/20 focus:ring-danger',
};

/** Versi focus-within untuk pembungkus (field berlabel di dalam, pemicu DatePicker). */
export const BOX_STATE = {
  default: 'border-mist-100 hover:border-mist focus-within:border-cobalt focus-within:ring-1 focus-within:ring-cobalt',
  success: 'border-mist-100 hover:border-mist focus-within:border-cobalt focus-within:ring-1 focus-within:ring-cobalt',
  error: 'border-danger ring-1 ring-danger/20 focus-within:ring-danger',
};

/** Tinggi kontrol: sm 36 · md 44 · lg 48. */
export const CONTROL_SIZES = { sm: 'h-9 rounded-xl text-sm', md: 'h-11 rounded-xl', lg: 'h-12 rounded-xl text-base' };
