'use client';

/* eslint-disable @next/next/no-img-element -- gambar statis di /public / unggahan admin */
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';
import { Reveal, ScrollProgress, SplitText } from './Motion';
import { FaqAccordion } from './FaqAccordion';
import { ContactAside, ContactForm } from './ContactSection';
import { SectionChrome } from './SectionChrome';
import { HeroBackground } from './HeroBackground';
import { HeroIntro } from './HeroIntro';
import { HeroVideo } from './HeroVideo';
import { StepsBento } from './StepsBento';
import { SkdExplorer } from './SkdExplorer';
import { TestimonialMarquee } from './TestimonialMarquee';
import { SectionMascot } from './SectionMascot';
import { GuidesSection } from './GuidesSection';

/**
 * Isi halaman utama, digerakkan oleh konten site (useSite). Section dengan visible:false tidak dirender.
 * Gambar fitur bawaan: scripts/generate-feature-art.py
 */
export function LandingContent() {
  const { sections, hero, features, faq, cta } = useSite();
  const show = (id) => sections[id]?.visible !== false;
  const head = (id) => {
    const { index, label, title, description, mascot } = sections[id] || {};
    return { index, label, title, description, mascot };
  };

  return (
    <>
      <SectionChrome />

      {/* ============ HERO ============ */}
      {show('hero') && (
        <ScrollProgress className="relative -mt-16 overflow-hidden">
          <HeroBackground className="absolute inset-0" />
          {/* Mobile: tinggi mengikuti isi (tanpa min-h layar penuh); efek scroll (--p) dimatikan lewat .hero-parallax di globals.css */}
          <section id="beranda" className="container-wide relative grid items-center gap-8 pb-12 pt-20 sm:min-h-[100svh] sm:gap-12 sm:pb-16 sm:pt-28 lg:grid-cols-2 lg:gap-16 lg:pb-20 lg:pt-24 2xl:gap-24">
            <div className="hero-parallax lg:pl-[4%]" style={{ opacity: 'calc(1 - var(--p) * 1.2)', transform: 'translate3d(0, calc(var(--p) * -70px), 0)' }}>
              <HeroIntro />
            </div>
            <Reveal variant="scale" delay={250}>
              <div className="hero-parallax relative" style={{ transform: 'perspective(1800px) rotateX(calc(var(--p) * 8deg)) scale(calc(1 - var(--p) * 0.08))', transformOrigin: 'center top' }}>
                <HeroVideo />
                {hero.mascot?.visible !== false && <HeroMascot image={hero.mascot?.image_url} bubble={hero.mascot?.bubble} />}
                {hero.emblem?.visible !== false && <HeroEmblem image={hero.emblem?.image_url} />}
              </div>
            </Reveal>
          </section>
        </ScrollProgress>
      )}

      {/* ============ FITUR ============ */}
      {show('fitur') && (
        <section id="fitur" className="section-screen">
          <div className="container-wide">
            <SectionHeading {...head('fitur')} />
            <div className="mt-8 space-y-4 sm:mt-10 sm:space-y-5 xl:mt-12 xl:space-y-6">
              {features.hero && <FeatureHero {...features.hero} />}
              {features.items?.length > 0 && (
                <div className={cn('grid gap-4 sm:gap-5 xl:gap-6', featureCols(features.items.length))}>
                  {features.items.map((f, i) => (
                    <FeaturePost key={`${i}-${f.title}`} {...f} delay={i * 110} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============ TESTIMONI ============ */}
      {show('testimoni') && (
        <section id="testimoni" className="section-screen overflow-hidden">
          <div className="container-wide">
            <SectionHeading {...head('testimoni')} />
          </div>
          <TestimonialMarquee className="mt-8 sm:mt-10 xl:mt-12" />
        </section>
      )}

      {/* ============ SKD ============ */}
      {show('skd') && (
        <section id="skd" className="section-screen">
          <div className="container-wide">
            <SectionHeading {...head('skd')} />
            <div className="mt-8 sm:mt-10 xl:mt-12">
              <SkdExplorer />
            </div>
          </div>
        </section>
      )}

      {/* ============ LANGKAH ============ */}
      {show('langkah') && (
        <section id="langkah" className="section-screen">
          <div className="container-wide">
            <SectionHeading {...head('langkah')} />
            <div className="mt-8 sm:mt-10">
              <StepsBento />
            </div>
          </div>
        </section>
      )}

      {/* ============ PANDUAN ============ */}
      {show('panduan') && (
        <section id="panduan" className="section-screen">
          <div className="container-wide">
            <SectionHeading {...head('panduan')} />
            <GuidesSection />
          </div>
        </section>
      )}

      {/* ============ FAQ ============ */}
      {show('faq') && (
        <section id="faq" className="section-screen">
          <div className="container-wide grid gap-8 sm:gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <div className="relative z-10 lg:sticky lg:top-28 lg:self-start">
              <SectionHeading align="left" {...head('faq')} />
            </div>
            <FaqAccordion items={faq.items || []} />
          </div>
        </section>
      )}

      {/* ============ KONTAK ============ */}
      {show('kontak') && (
        <section id="kontak" className="section-screen">
          <div className="container-wide grid gap-8 sm:gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
            <div className="relative z-10 lg:sticky lg:top-28 lg:self-start">
              <SectionHeading align="left" {...head('kontak')} />
              <ContactAside />
            </div>
            <Reveal variant="scale" delay={150}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ CTA ============ */}
      {show('cta') && (
        <section className="pb-14 pt-2 sm:pb-20 sm:pt-4 lg:pb-28">
          <div className="container-wide">
            <Reveal variant="scale">
              <div className="relative overflow-hidden rounded-[24px] bg-obsidian px-5 py-14 text-center text-white sm:rounded-[28px] sm:px-12 sm:py-20 lg:py-28">
                <span className="cta-orb cta-orb--a" aria-hidden />
                <span className="cta-orb cta-orb--b" aria-hidden />
                <div className="grid-dots-light pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_70%_at_50%_50%,#000,transparent)]" aria-hidden />
                {sections.cta?.mascot?.image && (
                  <div className="absolute bottom-6 right-6 z-10 hidden md:block lg:bottom-10 lg:right-12">
                    <SectionMascot image={sections.cta.mascot.image} say={sections.cta.mascot.say} tone="dark" size="w-[132px] lg:w-[176px]" />
                  </div>
                )}
                <div className="relative">
                  <SplitText
                    as="h2"
                    className="mx-auto block max-w-3xl text-2xl font-semibold leading-[1.2] tracking-[-0.025em] text-white sm:text-6xl sm:leading-none sm:tracking-[-0.035em]"
                    parts={[cta.title && { text: cta.title }, cta.accent && { text: cta.accent, className: 'text-mint' }].filter(Boolean)}
                  />
                  {cta.subtitle && (
                    <Reveal as="p" delay={250} className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-white/60 sm:mt-5 sm:text-lg sm:leading-relaxed">
                      {cta.subtitle}
                    </Reveal>
                  )}
                  <Reveal delay={350} className="mt-8 flex flex-col items-stretch justify-center gap-2.5 sm:mt-10 sm:flex-row sm:items-center sm:gap-3">
                    {cta.primary_label && (
                      <Button shape="pill" href={cta.primary_href || '/daftar'} size="xl" variant="mint" iconRight={<ArrowRight />}>
                        {cta.primary_label}
                      </Button>
                    )}
                    {cta.secondary_label && (
                      <Button shape="pill" href={cta.secondary_href || '/login'} size="xl" variant="ghost" className="text-white hover:bg-white/10">
                        {cta.secondary_label}
                      </Button>
                    )}
                  </Reveal>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}

/* ---------- Bagian-bagian ---------- */

/** Kolom grid kartu fitur sesuai jumlah item (4 → 2×2 lalu 4 kolom di xl). */
function featureCols(n) {
  if (n <= 1) return '';
  if (n === 2) return 'sm:grid-cols-2';
  if (n % 4 === 0) return 'sm:grid-cols-2 xl:grid-cols-4';
  if (n % 3 === 0) return 'md:grid-cols-3';
  return 'sm:grid-cols-2 lg:grid-cols-3';
}

/**
 * Emblem emas di kiri bawah video, sejajar (garis bawah sama) dengan maskot di kanan bawah. Bayangan tipis.
 * Rail langkah di HeroVideo memberi ruang di kedua ujung agar chip tidak tertutup.
 */
function HeroEmblem({ image }) {
  if (!image) return null;
  return (
    <div className="pointer-events-none absolute -bottom-5 -left-[84px] z-10 hidden w-[100px] lg:block xl:-left-[92px] xl:w-[120px] 2xl:-left-[100px]" aria-hidden>
      <img src={image} alt="" width={420} height={419} className="emblem-float h-auto w-full drop-shadow-[0_6px_8px_rgba(110,75,0,0.22)]" />
    </div>
  );
}

/** Maskot yang melambai di sudut kanan bawah video, dengan gelembung sapaan ke arah kiri. */
function HeroMascot({ image, bubble }) {
  if (!image) return null;
  return (
    <div className="pointer-events-none absolute -bottom-5 -right-[32px] z-10 hidden w-[104px] lg:block xl:-right-[36px] xl:w-[148px] 2xl:-right-[64px]" aria-hidden>
      {bubble && (
        <span className="mascot-bubble absolute -top-9 right-[46%] whitespace-nowrap rounded-2xl rounded-br-md bg-white px-3.5 py-2 text-[13px] font-semibold text-obsidian shadow-float ring-1 ring-mist-100">
          {bubble}
        </span>
      )}
      <img src={image} alt="" width={640} height={639} className="mascot-float h-auto w-full drop-shadow-[0_18px_24px_rgba(24,29,37,0.18)]" />
    </div>
  );
}

/** Judul section: label bernomor + judul yang muncul kata per kata + deskripsi. */
function SectionHeading({ index, label, title, description, mascot, align = 'split' }) {
  const buddy = mascot?.image ? (
    <Reveal variant="scale" delay={300} className="shrink-0">
      <SectionMascot image={mascot.image} say={mascot.say} side="right" />
    </Reveal>
  ) : null;
  const heading = (
    <div>
      <Reveal>
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-white pl-0.5 pr-2.5 text-[11px] font-medium sm:h-8 sm:gap-2 sm:pl-1 sm:pr-3.5 sm:text-[13px] text-obsidian-600 ring-1 ring-inset ring-mist-100">
          <span className="flex h-5 items-center rounded-full bg-obsidian px-2 font-mono text-[11px] font-semibold text-white sm:h-6">{index}</span>
          {label}
        </span>
      </Reveal>
      <SplitText as="h2" delay={120} className="mt-4 block text-2xl font-semibold leading-[1.2] tracking-[-0.025em] sm:mt-5 sm:text-5xl sm:leading-none sm:tracking-[-0.035em] xl:text-[56px]">
        {title}
      </SplitText>
    </div>
  );
  if (align === 'left') {
    return (
      <div className="max-w-md">
        {buddy ? (
          <div className="flex items-end justify-between gap-4">
            {heading}
            {buddy}
          </div>
        ) : (
          heading
        )}
        {description && (
          <Reveal as="p" delay={250} className="mt-2.5 text-[14px] leading-relaxed text-mist-700 sm:mt-5 sm:text-lg sm:leading-relaxed">
            {description}
          </Reveal>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 sm:gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
      <div className="flex items-end justify-between gap-4">
        {heading}
        {buddy && <div className="lg:hidden">{buddy}</div>}
      </div>
      {(description || buddy) && (
        <div className="flex items-end gap-6 lg:pb-1">
          {description && (
            <Reveal as="p" delay={250} className="max-w-sm text-[14px] leading-relaxed text-mist-700 sm:text-lg sm:leading-relaxed lg:pb-2 lg:text-right">
              {description}
            </Reveal>
          )}
          {buddy && <div className="hidden lg:block">{buddy}</div>}
        </div>
      )}
    </div>
  );
}

/** Kartu fitur utama: gambar kiri, teks kanan (gaya artikel unggulan). */
function FeatureHero({ tag, image, title, description, meta }) {
  const { brand } = useSite();
  return (
    <Reveal variant="scale">
      <article className="card-flat lift group grid overflow-hidden p-1.5 md:grid-cols-2">
        <div className="relative h-44 overflow-hidden rounded-[19px] bg-ghost sm:h-56 md:h-[clamp(240px,34svh,340px)]">
          {image && <img src={image} alt="" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]" />}
          <div className="absolute inset-y-0 right-0 hidden w-1/4 bg-gradient-to-r from-transparent to-white md:block" />
        </div>
        <div className="flex flex-col p-5 sm:p-9 lg:p-11">
          {tag && <Tag>{tag}</Tag>}
          <h3 className="mt-4 text-xl font-semibold leading-[1.25] tracking-[-0.02em] sm:mt-5 sm:text-3xl sm:leading-[1.1] sm:tracking-[-0.03em] lg:text-[40px]">{title}</h3>
          {description && <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-mist-700 sm:mt-4 sm:text-[17px]">{description}</p>}
          <div className="mt-auto flex items-center justify-between pt-6 max-sm:flex-wrap max-sm:gap-2 text-[13px] sm:pt-8 sm:text-sm">
            <span className="flex items-center gap-2 font-medium">
              <span className="h-2 w-2 rounded-full bg-obsidian" />
              {meta}
            </span>
            <span className="text-mist-700">
              oleh <span className="font-semibold italic text-obsidian">{brand.name}</span>
            </span>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/** Kartu fitur: gambar di atas (memudar ke putih) + tag, judul, deskripsi. */
function FeaturePost({ tag, image, title, description, delay }) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className="card-flat lift group flex h-full flex-col overflow-hidden p-1.5">
        <div className="relative h-40 overflow-hidden rounded-[19px] bg-ghost sm:h-44 lg:h-[clamp(150px,21svh,220px)]">
          {image && <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-white" />
          {tag && <Tag className="absolute right-3 top-3">{tag}</Tag>}
        </div>
        <div className="px-4 pb-5 pt-3 sm:px-5 sm:pb-6 lg:px-6">
          <h3 className="text-base font-semibold leading-snug tracking-tight sm:text-xl sm:leading-snug">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-mist-700 sm:mt-2 sm:text-[15px]">{description}</p>
        </div>
      </article>
    </Reveal>
  );
}

function Tag({ className, children }) {
  return <span className={cn('inline-flex h-6 w-fit items-center rounded-full bg-white/90 px-2.5 text-xs font-medium sm:h-7 sm:px-3 sm:text-[13px] text-obsidian ring-1 ring-inset ring-mist-100', className)}>{children}</span>;
}

export default LandingContent;
