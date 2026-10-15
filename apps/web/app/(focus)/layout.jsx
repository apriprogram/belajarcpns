// Ruang ujian: privat, jangan diindeks.
export const metadata = { robots: { index: false, follow: false } };

/** Layout fokus (ruang ujian CBT) — tanpa navigasi. */
export default function FocusLayout({ children }) {
  return <div className="min-h-screen bg-ghost">{children}</div>;
}
