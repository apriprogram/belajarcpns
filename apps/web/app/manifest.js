import { getSite } from '@/lib/site-server';
import { seoDescription } from '@/lib/seo';

// Nama & ikon mengikuti Atur Website → Branding.
export const dynamic = 'force-dynamic';

const TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', ico: 'image/x-icon', svg: 'image/svg+xml' };

export default async function manifest() {
  const site = await getSite();
  const { name, tagline, logo_url: logo } = site.brand;
  const ext = typeof logo === 'string' ? (logo.split('?')[0].split('.').pop() || '').toLowerCase() : '';
  const icons = logo
    ? [{ src: logo, sizes: 'any', ...(TYPES[ext] ? { type: TYPES[ext] } : {}), purpose: 'any' }]
    : [{ src: '/maskot/profil.webp', sizes: '440x433', type: 'image/webp', purpose: 'any' }];
  return {
    id: '/',
    name: tagline ? `${name} — ${tagline}` : name,
    short_name: name,
    description: seoDescription(site),
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F2F3F6',
    theme_color: '#3765F6',
    lang: 'id',
    dir: 'ltr',
    categories: ['education'],
    icons,
  };
}
