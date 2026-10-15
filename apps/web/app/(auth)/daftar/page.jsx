import { Suspense } from 'react';
import { RegisterForm } from './RegisterForm';

// Halaman daftar diindeks: target kueri "daftar tryout cpns gratis".
export const metadata = {
  title: 'Daftar Gratis — Tryout CPNS & Latihan Soal SKD',
  description:
    'Daftar gratis untuk tryout CPNS online sistem CAT (110 soal, 100 menit) dan latihan soal SKD TWK, TIU, TKP dengan pembahasan. Tanpa biaya, tanpa iklan.',
  alternates: { canonical: '/daftar' },
};

export default function DaftarPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
