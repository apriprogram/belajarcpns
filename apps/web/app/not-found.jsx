import { ArrowLeft, Compass } from 'lucide-react';
import { Button } from '@/components/ui';
import { Logo } from '@/components/layout/Logo';

export const metadata = { title: 'Halaman tidak ditemukan' };

export default function NotFound() {
  return (
    <div className="glow-cobalt flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Logo pill />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 pb-14 sm:pb-20">
        <div className="w-full max-w-lg rounded-card-lg bg-white p-6 text-center shadow-card sm:p-12">
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-cobalt-50 text-cobalt ring-8 ring-cobalt-50/50">
            <Compass className="h-6 w-6" />
          </span>
          <p className="font-mono text-sm font-medium text-mist-700">Kode 404</p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.025em] sm:text-4xl sm:tracking-[-0.03em]">Halaman tidak ditemukan</h1>
          <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-mist-700">
            Tautan yang Anda buka mungkin salah ketik atau halamannya sudah dipindahkan.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-2">
            <Button href="/" variant="secondary" icon={<ArrowLeft />}>
              Ke beranda
            </Button>
            <Button href="/dashboard">Buka dashboard</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
