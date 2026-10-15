'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui';

export default function Error({ error, reset }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="glow-cobalt flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-card-lg bg-white p-8 text-center shadow-card sm:p-12">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-danger-50 text-danger ring-8 ring-danger-50/50">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">Terjadi kesalahan</h1>
        <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-mist-700">
          Maaf, ada yang tidak beres saat memuat halaman ini. Silakan coba lagi.
        </p>
        {error?.digest && <p className="mt-4 font-mono text-xs text-mist-500">Ref: {error.digest}</p>}
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button href="/" variant="secondary" icon={<Home />}>
            Ke beranda
          </Button>
          <Button onClick={() => reset()} icon={<RotateCw />}>
            Coba lagi
          </Button>
        </div>
      </div>
    </div>
  );
}
