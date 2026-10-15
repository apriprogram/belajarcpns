import { NextResponse } from 'next/server';
import { PANDUAN_SLUGS } from './lib/panduan/meta';

/**
 * Proteksi rute (hanya untuk ROUTING — API tetap penjaga keamanan sebenarnya).
 * - Rute peserta butuh cookie access_token ATAU refresh_token.
 * - /admin/* butuh role admin: payload JWT access_token di-decode TANPA verifikasi.
 *   Jika access token kedaluwarsa/hilang tapi refresh_token ada → dibiarkan lewat
 *   (klien akan me-refresh lalu API memvalidasi role).
 * - Peserta yang membuka /admin → /dashboard.
 */

const PESERTA_PREFIXES = ['/dashboard', '/latihan', '/tryout', '/ujian', '/hasil', '/riwayat', '/profil', '/testimoni'];

function decodeJwt(token) {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const matches = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);

export function middleware(req) {
  const { pathname, search } = req.nextUrl;

  // Artikel panduan yang tidak ada → 404 sungguhan. (loading.jsx di root membuat halaman di-stream lebih dulu,
  // sehingga notFound() di halaman hanya bisa menghasilkan status 200 + noindex.)
  if (pathname.startsWith('/panduan/')) {
    let slug = pathname.slice('/panduan/'.length).replace(/\/+$/, '');
    try {
      slug = decodeURIComponent(slug);
    } catch {
      return panduanNotFound();
    }
    if (slug && !slug.includes('/') && !PANDUAN_SLUGS.includes(slug)) return panduanNotFound();
    return NextResponse.next();
  }
  const access = req.cookies.get('access_token')?.value;
  const refresh = req.cookies.get('refresh_token')?.value;

  const toLogin = () => {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + (search || ''))}`;
    return NextResponse.redirect(url);
  };

  if (matches(pathname, '/admin')) {
    if (!access && !refresh) return toLogin();
    if (access) {
      const payload = decodeJwt(access);
      const expired = !payload || (payload.exp && payload.exp * 1000 < Date.now());
      if (payload && !expired && payload.role !== 'admin') {
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        url.search = '';
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next();
  }

  if (PESERTA_PREFIXES.some((p) => matches(pathname, p))) {
    if (!access && !refresh) return toLogin();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/panduan/:slug',
    '/admin/:path*',
    '/admin',
    '/dashboard/:path*',
    '/latihan/:path*',
    '/tryout/:path*',
    '/ujian/:path*',
    '/hasil/:path*',
    '/riwayat/:path*',
    '/profil/:path*',
    '/testimoni/:path*',
  ],
};

/** Halaman 404 ringkas untuk slug panduan yang tidak dikenal (HTML mandiri, tanpa JS). */
function panduanNotFound() {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Panduan tidak ditemukan</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F2F3F6;color:#181D25;font-family:Inter,system-ui,Segoe UI,Roboto,sans-serif}main{max-width:420px;padding:32px;margin:16px;background:#fff;border-radius:24px;box-shadow:0 1px 0 #e4e9ef;text-align:center}h1{font-size:22px;margin:8px 0}p{color:#5a6678;line-height:1.6}a{display:inline-block;margin:6px;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600}a.p{background:#181D25;color:#fff}a.s{background:#ECF1FF;color:#3765F6}</style></head><body><main><div style="font-size:40px">404</div><h1>Panduan tidak ditemukan</h1><p>Artikel yang Anda cari tidak ada atau sudah dipindahkan.</p><a class="p" href="/panduan">Lihat semua panduan</a><a class="s" href="/">Beranda</a></main></body></html>`;
  return new NextResponse(html, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'x-robots-tag': 'noindex' } });
}

