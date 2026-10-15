import { Suspense } from 'react';
import { ReportView } from './ReportView';

export const metadata = { title: 'Laporan' };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ReportView />
    </Suspense>
  );
}
