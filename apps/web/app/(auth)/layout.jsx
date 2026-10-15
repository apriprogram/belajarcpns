import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandName, Logo } from '@/components/layout/Logo';
import { AuthVisual } from '@/components/auth/AuthVisual';

/**
 * Layout auth (ala Magnific): layar terbagi di lg+.
 * Kiri: area putih, form di tengah (maks 380px). Kanan: panel media rounded (slide otomatis) dengan gutter.
 * Di bawah lg panel media disembunyikan dan form memakai lebar penuh.
 * Kolom form ada lebih dulu di DOM (dan tampil lebih dulu) agar urutan Tab dimulai dari form.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-[100svh] bg-white lg:grid lg:grid-cols-2 lg:gap-3 lg:p-2.5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)]">
      <div className="flex min-h-[100svh] flex-col px-5 sm:px-8 lg:min-h-[calc(100svh-20px)]">
        <div className="flex justify-start pt-4 sm:pt-5">
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-mist-700 transition-colors hover:bg-ghost hover:text-obsidian"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Beranda
          </Link>
        </div>

        <main id="konten" className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="w-full max-w-[380px] animate-fade-up">
            <div className="mb-8 flex justify-center">
              <Logo />
            </div>
            {children}
          </div>
        </main>

        <footer className="pb-5 text-center text-xs text-mist-700">© {new Date().getFullYear()} <BrandName /> · Bukan situs resmi BKN</footer>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-2.5 h-[calc(100svh-20px)]">
          <AuthVisual />
        </div>
      </aside>
    </div>
  );
}
