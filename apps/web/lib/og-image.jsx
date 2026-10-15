/* eslint-disable @next/next/no-img-element -- satori (next/og) hanya mengenal <img>, bukan next/image */
import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { siteHost } from '@/lib/seo';

/**
 * Gambar Open Graph (1200×630) untuk beranda & artikel panduan — dipakai app/opengraph-image.jsx,
 * app/twitter-image.jsx, dan app/(public)/panduan/[slug]/opengraph-image.jsx. Lihat docs/SEO.md.
 *
 * Aset dibaca dari disk (process.cwd() = apps/web saat dev, /app di container standalone):
 * - font TTF di app/fonts (satori tidak bisa membaca woff2) — ikut ter-trace lewat
 *   `outputFileTracingIncludes` di next.config.mjs;
 * - maskot PNG di public/og (Dockerfile menyalin public/).
 * Aset gagal dibaca → tetap render (font bawaan next/og, tanpa maskot), bukan error 500.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const API = process.env.API_URL || 'http://localhost:8080';
const C = {
  bg: '#F7F8FB',
  obsidian: '#181D25',
  cobalt: '#3765F6',
  cobaltTint: '#E9EFFE',
  cobaltDeep: '#2448C7',
  mint: '#70FC8E',
  mist: '#C3CED7',
  muted: '#566173',
};
// Cache gambar di CDN/browser 1 jam (bawaan ImageResponse = immutable 1 tahun; konten ikut CMS).
const CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
const FONT = 'Plus Jakarta Sans';

let fontsPromise;
function loadFonts() {
  fontsPromise ||= Promise.all([
    readFile(path.join(process.cwd(), 'app/fonts/PlusJakartaSans-ExtraBold.ttf')),
    readFile(path.join(process.cwd(), 'app/fonts/PlusJakartaSans-SemiBold.ttf')),
  ])
    .then(([xb, sb]) => [
      { name: FONT, data: xb, weight: 800, style: 'normal' },
      { name: FONT, data: sb, weight: 600, style: 'normal' },
    ])
    .catch(() => null);
  return fontsPromise;
}

let mascotPromise;
function loadMascot() {
  mascotPromise ||= readFile(path.join(process.cwd(), 'public/og/maskot.png'))
    .then((buf) => `data:image/png;base64,${buf.toString('base64')}`)
    .catch(() => null);
  return mascotPromise;
}

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

/**
 * Logo brand sebagai data URI (PNG/JPEG saja — satori tidak membaca webp/svg/ico).
 * Hanya /uploads/* (lewat API internal) atau file di public/; URL eksternal tidak diambil (hindari SSRF).
 */
async function loadLogo(site) {
  const src = typeof site?.brand?.logo_url === 'string' ? site.brand.logo_url.trim() : '';
  const ext = (src.split('?')[0].split('.').pop() || '').toLowerCase();
  if (!src.startsWith('/') || src.startsWith('//') || src.includes('..') || !MIME[ext]) return null;
  try {
    if (src.startsWith('/uploads/')) {
      const res = await fetch(`${API}${src}`, { cache: 'no-store', signal: AbortSignal.timeout(2000) });
      const type = (res.headers.get('content-type') || '').split(';')[0].trim();
      if (!res.ok || !['image/png', 'image/jpeg'].includes(type)) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 2 * 1024 * 1024) return null;
      return `data:${type};base64,${buf.toString('base64')}`;
    }
    const buf = await readFile(path.join(process.cwd(), 'public', src));
    return `data:${MIME[ext]};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

async function loadAssets(site) {
  const [fonts, mascot, logo] = await Promise.all([loadFonts(), loadMascot(), loadLogo(site)]);
  return { fonts, mascot, logo };
}

function respond(element, fonts) {
  return new ImageResponse(element, {
    ...OG_SIZE,
    ...(fonts ? { fonts } : {}),
    headers: { 'Cache-Control': CACHE },
  });
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function tanggal(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : '';
}

/* ------------------------------------------------------------------ */
/* Potongan visual (semua div ber-anak >1 wajib display:flex di satori) */
/* ------------------------------------------------------------------ */

function Glow() {
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: -260,
          right: -200,
          width: 900,
          height: 900,
          borderRadius: 900,
          backgroundImage: 'radial-gradient(circle, rgba(55,101,246,0.22) 0%, rgba(55,101,246,0.08) 38%, rgba(55,101,246,0) 68%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -360,
          left: -260,
          width: 760,
          height: 760,
          borderRadius: 760,
          backgroundImage: 'radial-gradient(circle, rgba(55,101,246,0.10) 0%, rgba(55,101,246,0) 65%)',
        }}
      />
    </>
  );
}

function BrandRow({ site, logo }) {
  const name = site?.brand?.name || 'BELAJAR CPNS';
  const accent = site?.brand?.accent_char;
  const at = accent ? name.indexOf(accent) : -1;
  const letter = String(site?.brand?.logo_letter || name || 'B').charAt(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {logo ? (
        <img src={logo} alt="" width={60} height={60} style={{ width: 60, height: 60, borderRadius: 18, objectFit: 'cover' }} />
      ) : (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: 18,
            backgroundColor: C.obsidian,
            color: '#fff',
            fontSize: 32,
            fontWeight: 800,
          }}
        >
          {letter}
          <div style={{ position: 'absolute', top: 10, right: 10, width: 11, height: 11, borderRadius: 11, backgroundColor: C.mint }} />
        </div>
      )}
      <div style={{ display: 'flex', marginLeft: 18, fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: C.obsidian }}>
        {at < 0 ? (
          <span>{name}</span>
        ) : (
          <>
            <span>{name.slice(0, at)}</span>
            <span style={{ color: C.cobalt }}>{accent}</span>
            <span>{name.slice(at + accent.length)}</span>
          </>
        )}
      </div>
    </div>
  );
}

function Chip({ children, strong }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 54,
        padding: '0 24px',
        marginRight: 14,
        borderRadius: 54,
        fontSize: 24,
        fontWeight: 600,
        color: strong ? C.cobaltDeep : C.obsidian,
        backgroundColor: strong ? C.cobaltTint : '#FFFFFF',
        border: `2px solid ${strong ? '#D3DEFD' : '#E3E8ED'}`,
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 10, marginRight: 12, backgroundColor: strong ? C.cobalt : C.mint }} />
      {children}
    </div>
  );
}

function Domain({ site, suffix }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, fontWeight: 600, color: C.muted }}>
      <div style={{ width: 12, height: 12, borderRadius: 12, marginRight: 12, backgroundColor: C.mint, border: `2px solid ${C.obsidian}` }} />
      <span style={{ color: C.obsidian }}>{siteHost(site)}</span>
      {suffix ? <span>{suffix}</span> : null}
    </div>
  );
}

function Frame({ children, mascot, mascotWidth }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        width: '100%',
        height: '100%',
        backgroundColor: C.bg,
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      <Glow />
      {mascot ? (
        <img
          src={mascot}
          alt=""
          width={mascotWidth}
          height={Math.round(mascotWidth * (549 / 560))}
          style={{ position: 'absolute', right: 48, bottom: 0, width: mascotWidth, height: Math.round(mascotWidth * (549 / 560)) }}
        />
      ) : null}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', height: '100%', padding: '56px 64px' }}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** OG beranda: brand + headline + 3 chip + domain + maskot. */
export async function renderHomeOgImage(site) {
  const { fonts, mascot, logo } = await loadAssets(site);
  const line = { display: 'flex', fontSize: 70, fontWeight: 800, lineHeight: 1.06, letterSpacing: '-0.035em', color: C.obsidian };
  return respond(
    <Frame mascot={mascot} mascotWidth={440}>
      <BrandRow site={site} logo={logo} />
      <div style={{ display: 'flex', flexDirection: 'column', width: 640 }}>
        <div style={line}>{'Belajar CPNS &'}</div>
        <div style={line}>Tryout CAT SKD</div>
        <div style={{ ...line, color: C.cobalt }}>Gratis</div>
        <div style={{ display: 'flex', marginTop: 22, fontSize: 27, fontWeight: 600, lineHeight: 1.35, color: C.muted }}>
          Latihan TWK, TIU, TKP dengan timer server, skor per subtes, dan peringkat.
        </div>
        <div style={{ display: 'flex', marginTop: 30 }}>
          <Chip strong>110 soal</Chip>
          <Chip>100 menit</Chip>
          <Chip>Pembahasan</Chip>
        </div>
      </div>
      <Domain site={site} />
    </Frame>,
    fonts,
  );
}

/** OG artikel panduan: chip kategori + judul + info baca + domain/panduan. `meta` = entri ARTICLES (boleh null). */
export async function renderArticleOgImage(site, meta) {
  const { fonts, mascot, logo } = await loadAssets(site);
  const title = meta?.title || 'Panduan Belajar CPNS';
  const fontSize = title.length <= 34 ? 66 : title.length <= 56 ? 58 : 50;
  const info = [meta?.readMinutes ? `${meta.readMinutes} menit baca` : '', meta?.dateModified ? `Diperbarui ${tanggal(meta.dateModified)}` : ''].filter(Boolean).join('  ·  ');
  return respond(
    <Frame mascot={mascot} mascotWidth={340}>
      <BrandRow site={site} logo={logo} />
      <div style={{ display: 'flex', flexDirection: 'column', width: 740 }}>
        <div style={{ display: 'flex' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 46,
              padding: '0 20px',
              borderRadius: 46,
              fontSize: 22,
              fontWeight: 600,
              color: C.cobaltDeep,
              backgroundColor: C.cobaltTint,
              border: '2px solid #D3DEFD',
            }}
          >
            {`Panduan · ${meta?.category || 'CPNS'}`}
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 26, fontSize, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: C.obsidian }}>{title}</div>
        {info ? <div style={{ display: 'flex', marginTop: 24, fontSize: 25, fontWeight: 600, color: C.muted }}>{info}</div> : null}
      </div>
      <Domain site={site} suffix={meta?.slug ? '/panduan' : ''} />
    </Frame>,
    fonts,
  );
}
