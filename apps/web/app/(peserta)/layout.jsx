import { PesertaShell } from '@/components/layout/PesertaShell';

// Panel peserta: privat, jangan diindeks (juga X-Robots-Tag di next.config.mjs).
export const metadata = { robots: { index: false, follow: false } };

export default function PesertaLayout({ children }) {
  return <PesertaShell>{children}</PesertaShell>;
}
