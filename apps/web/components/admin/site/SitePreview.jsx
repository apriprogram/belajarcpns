'use client';

/* eslint-disable @next/next/no-img-element */
import { Fragment } from 'react';
import { EyeOff, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { seoDescription, seoTitle, siteHost } from '@/lib/seo';

/**
 * Pratinjau ringan per grup (bukan render halaman penuh) — membaca draft langsung,
 * jadi berubah seketika saat admin mengetik.
 */

/** Nama dengan karakter aksen diwarnai cobalt (hanya kemunculan pertama). */
export function BrandName({ brand, className, inverted }) {
  const name = (brand && brand.name) || 'Tanpa nama';
  const ch = brand && brand.accent_char;
  const at = ch ? name.indexOf(ch) : -1;
  return (
    <span className={cn('truncate text-[17px] font-bold tracking-[-0.03em]', inverted ? 'text-white' : 'text-obsidian', className)}>
      {at < 0 ? (
        name
      ) : (
        <>
          {name.slice(0, at)}
          <span className={inverted ? 'text-mint' : 'text-cobalt'}>{ch}</span>
          {name.slice(at + ch.length)}
        </>
      )}
    </span>
  );
}

export function BrandMark({ brand, className }) {
  if (brand && brand.logo_url) return <img src={brand.logo_url} alt="" className={cn('h-9 w-9 shrink-0 rounded-[12px] object-cover', className)} />;
  const letter = (brand && (brand.logo_letter || (brand.name || 'B')[0])) || 'B';
  return (
    <span className={cn('relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-obsidian text-white', className)} aria-hidden>
      <span className="text-[17px] font-bold tracking-tighter">{letter}</span>
      <span className="absolute right-[7px] top-[7px] h-[7px] w-[7px] rounded-full bg-mint" />
    </span>
  );
}

function Logo({ brand }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <BrandMark brand={brand} />
      <BrandName brand={brand} />
    </span>
  );
}

function Caption({ children }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-mist-700">{children}</p>;
}

function Hidden({ label = 'Disembunyikan' }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-ghost px-3 py-2.5 text-[13px] text-mist-700">
      <EyeOff className="h-4 w-4" aria-hidden />
      {label}
    </div>
  );
}

function Thumb({ src, video, className }) {
  if (!src) return <span className={cn('block bg-mist-100', className)} />;
  if (video) return <video src={src} muted playsInline preload="metadata" className={cn('block object-cover', className)} />;
  return <img src={src} alt="" className={cn('block object-cover', className)} />;
}

const vis = (site, key) => !(site.sections && site.sections[key] && site.sections[key].visible === false);

function SectionHead({ s }) {
  if (!s) return null;
  return (
    <div className="mb-3">
      <p className="font-mono text-[11px] text-mist-700">
        {s.index} · {s.label}
      </p>
      <p className="text-[15px] font-semibold tracking-[-0.01em] text-obsidian">{s.title}</p>
      {s.description && <p className="text-[12px] text-mist-700">{s.description}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */

const PREVIEWS = {
  seo: ({ site }) => {
    const og = site.seo && typeof site.seo.og_image === 'string' ? site.seo.og_image.trim() : '';
    const keywords = (site.seo && Array.isArray(site.seo.keywords) ? site.seo.keywords : []).filter(Boolean);
    return (
      <div className="space-y-4">
        <div>
          <Caption>Kartu bagikan (WhatsApp, Facebook, X)</Caption>
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-inset ring-mist-100">
            <Thumb src={og || '/opengraph-image'} className="aspect-[1200/630] w-full bg-ghost" />
            <div className="p-3">
              <p className="truncate text-[11px] uppercase tracking-[0.04em] text-mist-700">{siteHost(site)}</p>
              <p className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug text-obsidian">{seoTitle(site)}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-mist-700">{seoDescription(site)}</p>
            </div>
          </div>
          {!og && <p className="mt-1.5 text-[11px] text-mist-700">Gambar otomatis — diperbarui setelah perubahan disimpan.</p>}
        </div>
        {keywords.length > 0 && (
          <div>
            <Caption>Kata kunci</Caption>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((k, i) => (
                <span key={i} className="rounded-full bg-ghost px-2.5 py-1 text-[11px] font-medium text-obsidian">
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },

  branding: ({ site }) => {
    const b = site.brand || {};
    return (
      <div className="space-y-4">
        <div>
          <Caption>Navbar</Caption>
          <div className="flex h-14 items-center rounded-full bg-white pl-2 pr-4 ring-1 ring-inset ring-mist-100">
            <Logo brand={b} />
          </div>
        </div>
        <div>
          <Caption>Latar gelap</Caption>
          <div className="flex h-14 items-center gap-2.5 rounded-2xl bg-obsidian px-3">
            <BrandMark brand={b} className={!b.logo_url ? 'bg-white !text-obsidian' : ''} />
            <BrandName brand={b} inverted />
          </div>
        </div>
        <div>
          <Caption>Hasil pencarian</Caption>
          <div className="rounded-2xl bg-ghost p-3">
            <p className="truncate text-[15px] text-cobalt-700">
              {b.name}
              {b.tagline ? ` — ${b.tagline}` : ''}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-mist-700">{b.description}</p>
          </div>
        </div>
      </div>
    );
  },

  navbar: ({ site }) => {
    const n = site.navbar || {};
    const links = (n.links || []).filter((l) => vis(site, l.id));
    return (
      <div className="space-y-3 rounded-2xl bg-white p-3 ring-1 ring-inset ring-mist-100">
        <Logo brand={site.brand} />
        <div className="flex flex-wrap gap-1.5">
          {links.map((l) => (
            <span key={l.id} className="rounded-full bg-ghost px-3 py-1 text-[12px] font-medium text-obsidian">
              {l.label || l.id}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <span className="rounded-full px-3 py-1.5 text-[12px] font-semibold text-obsidian ring-1 ring-inset ring-mist-100">{n.login_label}</span>
          <span className="rounded-full bg-obsidian px-3 py-1.5 text-[12px] font-semibold text-white">{n.cta_label}</span>
        </div>
      </div>
    );
  },

  sections: ({ site }) => {
    const order = ['hero', 'fitur', 'testimoni', 'skd', 'langkah', 'panduan', 'faq', 'kontak', 'cta'];
    const names = { hero: 'Hero', cta: 'CTA penutup' };
    return (
      <ol className="space-y-1.5">
        {order.map((k) => {
          const s = (site.sections && site.sections[k]) || {};
          const on = s.visible !== false;
          return (
            <li key={k} className={cn('flex items-center gap-3 rounded-xl px-3 py-2 ring-1 ring-inset ring-mist-100', on ? 'bg-white' : 'bg-ghost')}>
              <span className="w-6 font-mono text-[11px] text-mist-700">{s.index || '—'}</span>
              <span className={cn('min-w-0 flex-1 truncate text-[13px] font-medium', on ? 'text-obsidian' : 'text-mist-500 line-through')}>{names[k] || s.title || k}</span>
              {!on && <EyeOff className="h-3.5 w-3.5 text-mist-500" aria-hidden />}
            </li>
          );
        })}
      </ol>
    );
  },

  hero: ({ site }) => {
    if (!vis(site, 'hero')) return <Hidden />;
    const h = site.hero || {};
    const m = (h.modes || [])[0] || {};
    return (
      <div className="space-y-3">
        <div className="flex gap-1 rounded-xl bg-ghost p-1">
          {(h.modes || []).map((x, i) => (
            <span key={i} className={cn('flex-1 rounded-lg px-2 py-1 text-center text-[12px] font-medium', i === 0 ? 'bg-white text-obsidian ring-1 ring-inset ring-mist-100' : 'text-mist-700')}>
              {x.tab}
            </span>
          ))}
        </div>
        <p className="text-[20px] font-semibold leading-tight tracking-[-0.02em] text-obsidian">
          {m.lead} <span className="text-cobalt">{m.accent}</span>
        </p>
        <ul className="space-y-1">
          {(m.points || []).map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-obsidian-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" />
              {p}
            </li>
          ))}
        </ul>
        <span className="inline-flex rounded-full bg-obsidian px-3.5 py-1.5 text-[12px] font-semibold text-white">{m.cta}</span>
        <div className="relative overflow-hidden rounded-2xl bg-obsidian">
          <Thumb src={h.poster_url} className="aspect-video w-full opacity-90" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90">
              <Play className="h-4 w-4 text-obsidian" aria-hidden />
            </span>
          </span>
          {h.mascot && h.mascot.visible !== false && h.mascot.bubble && (
            <span className="absolute bottom-2 right-2 max-w-[70%] truncate rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-obsidian">{h.mascot.bubble}</span>
          )}
        </div>
      </div>
    );
  },

  fitur: ({ site }) => {
    if (!vis(site, 'fitur')) return <Hidden />;
    const f = site.features || {};
    const h = f.hero || {};
    const n = (f.items || []).length;
    const twoCol = n === 2 || n === 4; // sama seperti grid di halaman (2×2)
    return (
      <div>
        <SectionHead s={site.sections && site.sections.fitur} />
        <div className="overflow-hidden rounded-2xl ring-1 ring-inset ring-mist-100">
          <Thumb src={h.image} className="aspect-[16/8] w-full" />
          <div className="p-3">
            <p className="text-[11px] font-semibold text-cobalt">{h.tag}</p>
            <p className="text-[13px] font-semibold text-obsidian">{h.title}</p>
            {h.meta && <p className="mt-0.5 font-mono text-[11px] text-mist-700">{h.meta}</p>}
          </div>
        </div>
        <div className={cn('mt-2 grid gap-2', twoCol ? 'grid-cols-2' : 'grid-cols-3')}>
          {(f.items || []).map((it, i) => (
            <div key={i} className="overflow-hidden rounded-xl ring-1 ring-inset ring-mist-100">
              <Thumb src={it.image} className={cn('w-full', twoCol ? 'aspect-[16/10]' : 'aspect-square')} />
              <p className="truncate px-2 py-1.5 text-[11px] font-medium text-obsidian">{it.title}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },

  skd: ({ site }) => {
    if (!vis(site, 'skd')) return <Hidden />;
    const k = site.skd || {};
    const subs = k.subtests || [];
    const total = subs.reduce((a, s) => a + (Number(s.count) || 0), 0);
    return (
      <div>
        <SectionHead s={site.sections && site.sections.skd} />
        <div className="space-y-2">
          {subs.map((s, i) => (
            <div key={i} className="rounded-xl bg-white p-3 ring-1 ring-inset ring-mist-100">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold text-obsidian">
                  <span className="font-mono text-cobalt">{s.code}</span> {s.name}
                </p>
                <p className="shrink-0 text-[11px] tabular-nums text-mist-700">
                  {s.count} soal · lulus {s.pass}/{s.max}
                </p>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(s.topics || []).map((t) => (
                  <span key={t} className="rounded-full bg-ghost px-2 py-0.5 text-[10px] text-mist-700">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-mist-700">
          {total} soal · {k.duration_minutes} menit. {k.note}
        </p>
      </div>
    );
  },

  langkah: ({ site }) => {
    if (!vis(site, 'langkah')) return <Hidden />;
    const s = site.steps || {};
    const cards = [
      { t: s.daftar && s.daftar.title, x: s.daftar && s.daftar.text, img: s.daftar && s.daftar.image },
      { t: s.latihan && s.latihan.title, x: s.latihan && s.latihan.text },
      { t: s.tryout && s.tryout.title, x: s.tryout && s.tryout.text, cta: s.tryout && s.tryout.cta },
      { t: s.hasil && s.hasil.title, x: s.hasil && s.hasil.text, img: s.hasil && s.hasil.images && s.hasil.images[0], badge: s.hasil && s.hasil.badge },
    ];
    return (
      <div>
        <SectionHead s={site.sections && site.sections.langkah} />
        <div className="grid grid-cols-2 gap-2">
          {cards.map((c, i) => (
            <div key={i} className="overflow-hidden rounded-xl ring-1 ring-inset ring-mist-100">
              {c.img && <Thumb src={c.img} className="aspect-[16/9] w-full" />}
              <div className="p-2.5">
                <p className="text-[12px] font-semibold text-obsidian">{c.t}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-mist-700">{c.x}</p>
                {c.cta && <p className="mt-1 text-[11px] font-semibold text-cobalt">{c.cta} →</p>}
                {c.badge && <span className="mt-1 inline-flex rounded-full bg-mint-50 px-2 py-0.5 text-[10px] font-semibold text-mint-700">{c.badge}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },

  faq: ({ site }) => {
    if (!vis(site, 'faq')) return <Hidden />;
    const items = (site.faq && site.faq.items) || [];
    return (
      <div>
        <SectionHead s={site.sections && site.sections.faq} />
        <div className="divide-y divide-mist-100 rounded-xl ring-1 ring-inset ring-mist-100">
          {items.slice(0, 6).map((it, i) => (
            <div key={i} className="px-3 py-2.5">
              <p className="text-[12px] font-semibold text-obsidian">{it.q || 'Pertanyaan kosong'}</p>
              {i === 0 && <p className="mt-1 text-[11px] text-mist-700">{it.a}</p>}
            </div>
          ))}
        </div>
        {items.length > 6 && <p className="mt-2 text-[11px] text-mist-700">+{items.length - 6} lainnya</p>}
      </div>
    );
  },

  kontak: ({ site }) => {
    if (!vis(site, 'kontak')) return <Hidden />;
    const aside = (site.kontak && site.kontak.aside) || [];
    return (
      <div>
        <SectionHead s={site.sections && site.sections.kontak} />
        <div className="space-y-2">
          {aside.map((a, i) => (
            <div key={i} className="rounded-xl bg-ghost p-3">
              <p className="text-[12px] font-semibold text-obsidian">{a.title}</p>
              <p className="text-[11px] text-mist-700">{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  },

  cta: ({ site }) => {
    if (!vis(site, 'cta')) return <Hidden />;
    const c = site.cta || {};
    return (
      <div className="rounded-2xl bg-obsidian p-5 text-center">
        <p className="text-[20px] font-semibold tracking-[-0.02em] text-white">
          {c.title} <span className="text-mint">{c.accent}</span>
        </p>
        <p className="mt-1 text-[12px] text-mist">{c.subtitle}</p>
        <div className="mt-3 flex justify-center gap-2">
          <span className="rounded-full bg-white px-3.5 py-1.5 text-[12px] font-semibold text-obsidian">{c.primary_label}</span>
          <span className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-white ring-1 ring-inset ring-white/30">{c.secondary_label}</span>
        </div>
      </div>
    );
  },

  footer: ({ site }) => {
    const f = site.footer || {};
    const year = new Date().getFullYear();
    return (
      <div className="rounded-2xl bg-white p-4 ring-1 ring-inset ring-mist-100">
        <Logo brand={site.brand} />
        <p className="mt-2 text-[12px] text-mist-700">{f.description}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(f.columns || []).map((c, i) => (
            <div key={i} className="min-w-0">
              <p className="truncate text-[11px] font-semibold text-obsidian">{c.title}</p>
              {(c.links || []).map((l, j) => (
                <p key={j} className="truncate text-[11px] text-mist-700">
                  {l.label}
                </p>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-1 border-t border-mist-100 pt-2 text-[10px] text-mist-700">
          <span>
            © {year} {site.brand && site.brand.name}. {f.copyright}
          </span>
          <span>{f.tagline}</span>
        </div>
      </div>
    );
  },

  auth: ({ site }) => {
    const slides = (site.auth && site.auth.slides) || [];
    const first = slides[0] || {};
    return (
      <div>
        <div className="relative overflow-hidden rounded-[20px] bg-obsidian">
          <Thumb src={first.video ? first.poster || first.video : first.image} video={!!first.video && !first.poster} className="aspect-[4/5] w-full opacity-80" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-obsidian/90 to-transparent p-4">
            <p className="text-[15px] font-semibold text-white">{first.title}</p>
            <p className="text-[11px] text-white/75">{first.subtitle}</p>
            <div className="mt-3 flex gap-2">
              {slides.map((s, i) => (
                <Fragment key={i}>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block h-0.5 rounded-full', i === 0 ? 'bg-white' : 'bg-white/30')} />
                    <span className="mt-1 block truncate text-[10px] text-white/80">{s.label}</span>
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export function SitePreview({ group, site }) {
  const P = PREVIEWS[group];
  if (!P || !site) return null;
  return <P site={site} />;
}

export default SitePreview;
