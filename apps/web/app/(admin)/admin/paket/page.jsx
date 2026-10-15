import { Suspense } from 'react';
import { PackagesView } from './PackagesView';

export const metadata = { title: 'Paket ujian' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PackagesView />
    </Suspense>
  );
}
