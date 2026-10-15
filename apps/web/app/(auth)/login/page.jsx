import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

// Boleh dirayapi (tautan diikuti) tapi tidak diindeks — docs/SEO.md.
export const metadata = { title: 'Masuk', robots: { index: false, follow: true } };

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
