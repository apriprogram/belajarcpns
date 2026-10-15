import { Suspense } from 'react';
import { ResetForm } from './ResetForm';

export const metadata = { title: 'Atur ulang kata sandi', robots: { index: false, follow: true } };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
