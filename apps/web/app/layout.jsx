import localFont from 'next/font/local';
import { Providers } from '@/components/providers/Providers';
import { getSite, getSiteRaw } from '@/lib/site-server';
import { seoDescription, seoTitle, siteUrl } from '@/lib/seo';
import { ogImages, verificationCode } from '@/lib/seo-metadata';
import './globals.css';

// Inter & JetBrains Mono (variable) di-self-host → build tidak butuh akses Google Fonts.
const inter = localFont({
  src: './fonts/Inter-Variable.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
});
const mono = localFont({
  src: './fonts/JetBrainsMono-Variable.woff2',
  variable: '--font-mono',
  weight: '100 800',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});

/*
 * Metadata global (docs/SEO.md). Sengaja TIDAK memasang `alternates.canonical` / `openGraph.url` / judul OG di
 * sini: nilai itu diwarisi semua halaman anak, jadi canonical "/" akan salah untuk /daftar, /panduan, dst.
 * Canonical diisi per halaman (beranda: app/(public)/page.jsx). og:title & og:description otomatis mengikuti
 * title/description tiap halaman.
 */
export async function generateMetadata() {
  const site = await getSite();
  const seo = site.seo || {};
  const { name, logo_url: logo, logo_letter: letter } = site.brand;
  // Favicon = logo website; tanpa logo → kotak obsidian dengan huruf logo (SVG).
  const ch = String(letter || name || 'B').charAt(0).replace(/[<&>"']/g, '');
  const fallback = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#181D25"/><text x="30" y="45" font-family="Inter,Arial,sans-serif" font-size="38" font-weight="700" fill="#fff" text-anchor="middle">${ch}</text><circle cx="50" cy="14" r="6" fill="#70FC8E"/></svg>`,
  )}`;
  const icon = logo || fallback;
  const title = seoTitle(site);
  const images = ogImages(site, title);
  const bing = verificationCode(seo.bing_verification);
  const keywords = Array.isArray(seo.keywords) ? seo.keywords.map((k) => String(k).trim()).filter(Boolean) : undefined;

  return {
    metadataBase: new URL(siteUrl(site)),
    title: { default: title, template: `%s · ${name}` },
    description: seoDescription(site),
    keywords: keywords?.length ? keywords : undefined,
    applicationName: name,
    // `images` hanya dipasang bila og_image diisi — kalau ada key `images`, opengraph-image.jsx diabaikan Next.
    openGraph: { type: 'website', locale: 'id_ID', siteName: name, ...(images ? { images } : {}) },
    twitter: { card: 'summary_large_image', ...(images ? { images } : {}) },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
    },
    verification: {
      google: verificationCode(seo.google_verification),
      ...(bing ? { other: { 'msvalidate.01': bing } } : {}),
    },
    category: 'education',
    formatDetection: { telephone: false },
    icons: { icon, shortcut: icon, apple: logo || undefined },
  };
}

export const viewport = {
  themeColor: '#F2F3F6',
  width: 'device-width',
  initialScale: 1,
  // Konten boleh sampai tepi layar ber-notch; jarak aman diatur lewat env(safe-area-inset-*).
  viewportFit: 'cover',
};

export default async function RootLayout({ children }) {
  const raw = await getSiteRaw();
  // Env SITE_URL (server-only) diteruskan ke klien agar domain tampilan (siteHost) sama di SSR & hidrasi.
  const envUrl = process.env.SITE_URL;
  const initialSite = envUrl ? { ...raw, seo: { ...(raw.seo || {}), site_url: siteUrl(raw) } } : raw;
  return (
    <html lang="id" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-ghost font-sans text-obsidian antialiased">
        <Providers initialSite={initialSite}>{children}</Providers>
      </body>
    </html>
  );
}
