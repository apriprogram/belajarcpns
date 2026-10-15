'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal } from './Motion';

/**
 * FAQ: satu item terbuka sekaligus, buka/tutup beranimasi tinggi (grid-rows), bernomor.
 * items: array { q, a } (site.faq.items) atau tuple [q, a].
 */
export function FaqAccordion({ items = [] }) {
  const [open, setOpen] = useState(0);
  const base = useId();
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => {
        const [q, a] = Array.isArray(item) ? item : [item?.q, item?.a];
        const isOpen = open === i;
        const id = `${base}-${i}`;
        return (
          <Reveal key={`${i}-${q}`} delay={i * 60}>
            <div className={cn('rounded-[20px] ring-1 ring-inset transition-colors duration-300', isOpen ? 'bg-white ring-mist-100' : 'bg-ghost/70 ring-transparent hover:bg-ghost')}>
              <h3>
                <button
                  type="button"
                  id={`${id}-q`}
                  aria-expanded={isOpen}
                  aria-controls={`${id}-a`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center gap-4 rounded-[20px] px-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt sm:px-6"
                >
                  <span className={cn('font-mono text-xs font-semibold transition-colors', isOpen ? 'text-cobalt' : 'text-mist-500')}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 text-[15px] font-semibold sm:text-base">{q}</span>
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                      isOpen ? 'rotate-45 bg-obsidian text-white' : 'bg-white text-obsidian ring-1 ring-inset ring-mist-100',
                    )}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
              </h3>
              <div
                id={`${id}-a`}
                role="region"
                aria-labelledby={`${id}-q`}
                className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden" inert={!isOpen}>
                  <p className={cn('pb-6 pl-[52px] pr-6 text-[15px] leading-relaxed text-mist-700 transition-opacity duration-500 sm:pl-[60px]', isOpen ? 'opacity-100' : 'opacity-0')}>{a}</p>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

export default FaqAccordion;
