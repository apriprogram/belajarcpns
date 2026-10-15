import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

export default function PublicLayout({ children }) {
  return (
    <div className="relative min-h-screen">
      <PublicNavbar />
      <main id="konten">{children}</main>
      <PublicFooter />
      <ScrollToTop />
    </div>
  );
}
