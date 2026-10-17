'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useSite } from '@/components/providers/SiteProvider';
import { SITE_DEFAULTS } from '@/lib/site-defaults';
import { SplitText } from './Motion';

/** Sisi kiri hero: toggle mode, judul, checklist, satu tombol utama. */
export function HeroIntro() {
  const { hero } = useSite();
  const modes = (hero.modes?.length ? hero.modes : SITE_DEFAULTS.hero.modes).slice(0, 3);
  const [picked, setMode] = useState(0);
  const mode = Math.min(picked, modes.length - 1);
  const m = modes[mode];
  const n = modes.length;
  return (
    <div className="max-w-[640px]">
      <div role="tablist" aria-label="Pilih mode" className="relative inline-grid rounded-full bg-ghost p-1 animate-fade-up" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {/* indikator meluncur */}
        <span
          aria-hidden
          className="absolute inset-y-1 left-1 rounded-full bg-white ring-1 ring-inset ring-mist-100 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
          style={{ width: `calc((100% - 8px) / ${n})`, transform: `translateX(${mode * 100}%)` }}
        />
        {modes.map((v, i) => (
          <button
            key={`${i}-${v.key || v.tab}`}
            type="button"
            role="tab"
            aria-selected={mode === i}
            onClick={() => setMode(i)}
            className={cn(
              // Mobile: tombol 40px + area sentuh tak terlihat (after) ±4px atas-bawah → 48px.
              'relative z-10 h-10 rounded-full px-5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors duration-300 after:absolute after:inset-x-0 after:-inset-y-1 sm:h-9 sm:after:hidden',
              mode === i ? 'text-obsidian' : 'text-mist-700 hover:text-obsidian',
            )}
          >
            {v.tab}
          </button>
        ))}
      </div>

      <SplitText
        key={`h-${mode}`}
        as="h1"
        delay={100}
        stagger={70}
        className="mt-6 block text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] sm:mt-8 sm:text-6xl sm:leading-none sm:tracking-[-0.045em] xl:text-[72px]"
        parts={[m.lead && { text: m.lead }, m.accent && { text: m.accent, className: 'text-cobalt' }].filter(Boolean)}
      />

      <ul key={`l-${mode}`} className="mt-6 space-y-3 sm:mt-9 sm:space-y-4">
        {(m.points || []).map((p, i) => (
          <li key={`${i}-${p}`} className="flex animate-fade-up items-center gap-2.5 text-base leading-snug text-obsidian-600 sm:gap-3 sm:text-[17px] sm:leading-normal" style={{ animationDelay: `${450 + i * 90}ms` }}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cobalt-50 text-cobalt sm:h-6 sm:w-6">
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} />
            </span>
            {p}
          </li>
        ))}
      </ul>

      {m.cta && (
        <Button shape="pill" href={m.href || '/daftar'} size="xl" icon={<Sparkles />} className="mt-8 animate-fade-up [animation-delay:750ms] max-sm:h-12 max-sm:px-6 max-sm:text-[15px] sm:mt-11">
          {m.cta}
        </Button>
      )}
    </div>
  );
}

export default HeroIntro;
