'use client';

/* eslint-disable @next/next/no-img-element -- screenshot statis di /public / unggahan admin, tanpa optimasi gambar */
import { ArrowRight, BookOpenCheck, CheckCircle2, Mail, Phone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { LogoMark } from '@/components/layout/Logo';
import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';
import { siteHost } from '@/lib/seo';
import { Reveal } from './Motion';
import { CbtMockup } from './CbtMockup';
import { RichText } from './RichText';

/**
 * Section "Tiga langkah" bergaya bento: judul besar + deskripsi singkat di atas,
 * visual mengisi bagian bawah kartu. Screenshot dari scripts/capture-landing-shots.py.
 */
export function StepsBento() {
  const site = useSite();
  const { steps, navbar } = site;
  const domain = siteHost(site); // domain asli (SITE_URL / Atur Website → SEO)
  const { daftar, latihan, tryout, hasil } = steps;
  return (
    <div className="grid gap-5 lg:h-[clamp(520px,calc(100svh-290px),660px)] lg:grid-cols-12 lg:grid-rows-2 xl:gap-6">
      {/* 01 · Daftar */}
      <Reveal className="card-flat relative flex min-h-[340px] flex-col overflow-hidden lg:col-span-4 lg:min-h-0">
        <StepHead n="01" title={daftar.title}>
          <RichText text={daftar.text} />
        </StepHead>
        <div className="relative mx-3 mb-3 mt-5 min-h-[170px] flex-1 overflow-hidden rounded-[20px] bg-gradient-to-br from-cobalt-50 via-cobalt-50/60 to-white ring-1 ring-inset ring-cobalt-100/70">
          <div aria-hidden className="absolute inset-0 opacity-70 [background-image:radial-gradient(#DCE5FE_1px,transparent_1px)] [background-size:16px_16px]" />
          {daftar.image && (
            <img
              src={daftar.image}
              alt=""
              loading="lazy"
              className="absolute left-4 top-4 w-[66%] max-w-[300px] -rotate-[2deg] rounded-2xl bg-white shadow-[0_10px_30px_-12px_rgba(31,63,176,0.35)] ring-1 ring-mist-100 sm:left-5"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-cobalt-50 via-cobalt-50/70 to-transparent" />
          <div className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
            <GlassPill icon={<Mail />}>Email</GlassPill>
            <GlassPill icon={<Phone />}>No. HP</GlassPill>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-obsidian text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Reveal>

      {/* 02 · Latihan */}
      <Reveal delay={100} className="card-flat relative flex min-h-[340px] flex-col overflow-hidden lg:col-span-4 lg:min-h-0">
        <StepHead n="02" title={latihan.title}>
          <RichText text={latihan.text} />
        </StepHead>
        <PracticeNetwork />
      </Reveal>

      {/* 03 · Tryout (tinggi) */}
      <Reveal delay={200} className="relative flex min-h-[560px] flex-col overflow-hidden rounded-card bg-white ring-1 ring-inset ring-mist-100 lg:col-span-4 lg:row-span-2 lg:min-h-0">
        <div className="mx-3 mt-3 flex h-11 items-center justify-between rounded-full bg-ghost pl-2 pr-4">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <LogoMark className="!h-7 !w-7 !rounded-full" />
            {domain}<span className="text-mist-500">/ujian</span>
          </span>
          <span className="flex gap-1" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-mist" />
            <span className="h-2 w-2 rounded-full bg-mist" />
            <span className="h-2 w-2 rounded-full bg-mist" />
          </span>
        </div>
        <div className="relative z-10 flex flex-col items-center px-6 pt-6 text-center sm:px-7 sm:pt-7">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-medium ring-1 ring-inset ring-mist-100">
            Langkah <span className="flex h-4 w-4 items-center justify-center rounded-full bg-obsidian font-mono text-[10px] text-white">3</span>
          </span>
          <h3 className="mt-4 text-[24px] font-semibold leading-tight tracking-[-0.025em] sm:text-[30px] sm:tracking-[-0.03em] xl:text-[34px]">{tryout.title}</h3>
          <p className="mt-2 max-w-[300px] text-[15px] leading-relaxed text-mist-700">
            <RichText text={tryout.text} boldClassName="font-semibold text-obsidian" />
          </p>
          {tryout.cta && (
            <Button shape="pill" href={tryout.href || '/daftar'} size="md" className="mt-5" iconRight={<ArrowRight />}>
              {tryout.cta}
            </Button>
          )}
        </div>
        {/* Layar ujian di atas gelombang */}
        <div className="relative mt-6 min-h-[300px] flex-1">
          <BlueGlow />
          <div className="absolute inset-x-6 top-5 lg:inset-x-5 xl:inset-x-7" style={{ perspective: '1400px' }}>
            <CbtMockup className="origin-top transition-transform duration-700 [transform:rotateX(6deg)]" />
          </div>
        </div>
      </Reveal>

      {/* Lalu · Hasil (lebar) */}
      <Reveal delay={150} className="glow-cobalt-dark relative flex overflow-hidden rounded-card bg-obsidian sm:min-h-[380px] lg:col-span-8 lg:min-h-0">
        <div className="pointer-events-none absolute -bottom-24 left-[30%] h-64 w-64 rounded-full bg-mint/15 blur-3xl" aria-hidden />
        <div className="relative z-10 flex max-w-[440px] flex-col justify-between p-6 sm:p-8 xl:p-10">
          <div>
            {hasil.eyebrow && <span className="font-mono text-xs font-semibold text-mint">{hasil.eyebrow}</span>}
            <h3 className="mt-3 text-[24px] font-semibold leading-[1.15] tracking-[-0.025em] text-white sm:text-[30px] sm:leading-[1.1] sm:tracking-[-0.03em] xl:text-[36px]">{hasil.title}</h3>
            <p className="mt-3 max-w-[340px] text-[15px] leading-relaxed text-white/60">
              <RichText text={hasil.text} boldClassName="font-semibold text-white" />
            </p>
          </div>
          <div className="mt-6 flex gap-2">
            <Button shape="pill" href="/daftar" variant="mint" size="md">
              {navbar.cta_label}
            </Button>
            <Button shape="pill" href="/login" variant="secondary" size="md" className="!ring-0">
              {navbar.login_label}
            </Button>
          </div>
        </div>
        <ResultCollage images={hasil.images || []} badge={hasil.badge} />
      </Reveal>
    </div>
  );
}

function StepHead({ n, title, children }) {
  return (
    <div className="px-6 pt-6 sm:px-7 sm:pt-7 xl:px-8 xl:pt-8">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[24px] font-semibold leading-tight tracking-[-0.025em] sm:text-[30px] sm:tracking-[-0.03em] xl:text-[34px]">{title}</h3>
        <span className="mt-2 font-mono text-sm font-semibold text-mist-500">{n}</span>
      </div>
      <p className="mt-2 max-w-[300px] text-[15px] leading-relaxed text-mist-700 [&_b]:font-semibold [&_b]:text-obsidian">{children}</p>
    </div>
  );
}

function GlassPill({ icon, children }) {
  return (
    <span className="glass inline-flex h-10 items-center gap-2 rounded-full !bg-white/70 px-4 text-sm font-medium text-obsidian [&>svg]:h-4 [&>svg]:w-4">
      {icon}
      {children}
    </span>
  );
}

/** Diagram jaringan: Anda → subtes → pembahasan. Garis "tergambar" saat terlihat. */
function PracticeNetwork() {
  const nodes = [
    { x: 14, y: 66, label: 'TWK', tone: 'bg-cobalt-50 text-cobalt-700' },
    { x: 37, y: 78, label: 'TIU', tone: 'bg-warning-50 text-warning-700' },
    { x: 63, y: 78, label: 'TKP', tone: 'bg-mint-50 text-mint-700' },
  ];
  return (
    <div className="relative mx-2 mb-2 mt-1 min-h-[180px] flex-1">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        {/* kipas garis tipis */}
        {[-30, -12, 112, 130].map((x, i) => (
          <path key={i} d={`M50 20 Q ${x < 50 ? 25 : 75} 30 ${x} 62`} className="stroke-mist-100" fill="none" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        ))}
        {[...nodes, { x: 86, y: 62 }].map((nd, i) => (
          <path
            key={i}
            d={`M50 20 Q ${(50 + nd.x) / 2} 26 ${nd.x} ${nd.y}`}
            pathLength="1"
            className="draw stroke-mist"
            fill="none"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            style={{ '--d': `${200 + i * 120}ms` }}
          />
        ))}
      </svg>
      {/* pusat */}
      <span className="absolute left-1/2 top-[20%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white ring-4 ring-cobalt-50">
        <LogoMark className="!h-10 !w-10 !rounded-full" />
      </span>
      {nodes.map((nd) => (
        <span
          key={nd.label}
          className={cn('absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-mono text-[11px] font-bold ring-4 ring-white', nd.tone)}
          style={{ left: `${nd.x}%`, top: `${nd.y}%` }}
        >
          {nd.label}
        </span>
      ))}
      <span className="absolute left-[86%] top-[62%] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-obsidian text-mint ring-4 ring-white">
        <BookOpenCheck className="h-5 w-5" />
      </span>
      <span className="absolute left-[86%] top-[62%] ml-3 mt-3 flex h-5 w-5 items-center justify-center rounded-full bg-mint text-obsidian ring-2 ring-white">
        <CheckCircle2 className="h-3 w-3" />
      </span>
    </div>
  );
}

/** Latar layar ujian: gradasi biru lembut (statis, tanpa animasi). */
function BlueGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cobalt-100/80 to-cobalt" />
      <div className="absolute -bottom-24 left-1/2 h-64 w-[120%] -translate-x-1/2 rounded-[100%] bg-cobalt-600/60 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white to-transparent" />
    </div>
  );
}

/** Kolase screenshot hasil & latihan yang miring. */
function ResultCollage({ images, badge }) {
  const [back, front] = images;
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] sm:block" aria-hidden>
      {back && <img src={back} alt="" loading="lazy" className="collage-in absolute right-[-6%] top-[14%] w-[78%] rotate-[5deg] rounded-2xl opacity-60 ring-1 ring-white/10" style={{ '--d': '250ms' }} />}
      {front && <img src={front} alt="" loading="lazy" className="collage-in absolute bottom-[-18%] left-[2%] w-[82%] -rotate-[4deg] rounded-2xl ring-1 ring-white/20" style={{ '--d': '400ms' }} />}
      {badge && (
        <span className="collage-in absolute bottom-[14%] right-[8%] inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm font-semibold text-obsidian" style={{ '--d': '650ms' }}>
          <Sparkles className="h-4 w-4" /> {badge}
        </span>
      )}
    </div>
  );
}

export default StepsBento;
