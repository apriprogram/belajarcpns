/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL || 'http://localhost:8080';

// Halaman privat/auth: jangan diindeks (docs/SEO.md). robots.txt juga memblokir sebagian besar path ini.
const NOINDEX_PATHS = [
  '/admin',
  '/dashboard',
  '/latihan',
  '/tryout',
  '/ujian',
  '/hasil',
  '/riwayat',
  '/profil',
  '/testimoni',
  '/design-system',
  '/lupa-password',
  '/reset-password',
  '/login',
];
const NOINDEX = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // Font TTF untuk gambar Open Graph dibaca lewat fs (lib/og-image.jsx) → pastikan ikut ke output standalone.
  outputFileTracingIncludes: {
    '/opengraph-image': ['./app/fonts/*.ttf'],
    '/twitter-image': ['./app/fonts/*.ttf'],
  },
  async headers() {
    return NOINDEX_PATHS.flatMap((p) => [
      { source: p, headers: NOINDEX },
      { source: `${p}/:path*`, headers: NOINDEX },
    ]);
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_URL}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
