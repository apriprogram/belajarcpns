'use client';

import { AuthProvider } from './AuthProvider';
import { SiteProvider } from './SiteProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { VisitTracker } from '@/components/analytics/VisitTracker';

/** Semua provider global klien. Dipasang di app/layout.jsx. `initialSite` = objek site mentah dari server. */
export function Providers({ initialSite, children }) {
  return (
    <SiteProvider initial={initialSite}>
      <ToastProvider>
        <AuthProvider>
          <VisitTracker />
          {children}
        </AuthProvider>
      </ToastProvider>
    </SiteProvider>
  );
}

export default Providers;
