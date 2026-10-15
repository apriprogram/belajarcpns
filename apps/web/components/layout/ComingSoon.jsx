import { Hammer } from 'lucide-react';
import { PageHeader } from './PageHeader';

/** Placeholder sementara — divisi halaman akan menimpa page.jsx yang memakai ini. */
export function ComingSoon({ title, description = 'Halaman ini sedang disiapkan.' }) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center rounded-[20px] bg-white px-6 py-20 text-center ring-1 ring-inset ring-mist-100">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ghost text-obsidian-600">
          <Hammer className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">Segera hadir</h2>
        <p className="mt-1.5 max-w-sm text-sm text-mist-700">Kami sedang menyiapkan fitur ini. Silakan kembali lagi nanti.</p>
      </div>
    </>
  );
}

export default ComingSoon;
