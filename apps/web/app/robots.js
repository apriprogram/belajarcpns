import { getSite } from '@/lib/site-server';
import { PRIVATE_PATHS, absoluteUrl, siteUrl } from '@/lib/seo';

// URL sitemap/host mengikuti SITE_URL / Atur Website → SEO, jadi dibuat per request.
export const dynamic = 'force-dynamic';

/** Crawler mesin pencari & AI yang diizinkan eksplisit (aturan sama dengan '*'). */
const CRAWLERS = [
  'Googlebot',
  'Bingbot',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-SearchBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot',
  'Applebot-Extended',
  'DuckDuckBot',
  'YandexBot',
  'CCBot',
];

export default async function robots() {
  const site = await getSite();
  const allow = ['/', '/uploads/'];
  const disallow = PRIVATE_PATHS;
  return {
    // Satu grup dengan banyak baris User-Agent (RFC 9309) — crawler yang punya grup sendiri mengabaikan '*'.
    rules: [
      { userAgent: '*', allow, disallow },
      { userAgent: CRAWLERS, allow, disallow },
    ],
    sitemap: absoluteUrl(site, '/sitemap.xml'),
    host: siteUrl(site),
  };
}
