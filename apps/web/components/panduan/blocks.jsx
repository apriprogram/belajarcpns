import { ChevronDown, Info, Lightbulb, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';
import { splitOption } from '@/lib/panduan/text';
import { Inline } from './Inline';

/*
 * Blok isi artikel (skema docs/SEO.md): p, h3, ul, ol, table, callout, question.
 * Semua Server-safe (tanpa state) — teks lengkap ada di HTML.
 */

export function Paragraph({ text }) {
  return (
    <p className="my-5 text-[16.5px] leading-[1.8] text-obsidian-800 sm:text-[17px]">
      <Inline text={text} />
    </p>
  );
}

export function SubHeading({ text }) {
  return (
    <h3 className="mb-3 mt-9 text-lg font-semibold leading-snug tracking-[-0.015em] sm:text-xl">
      <Inline text={text} />
    </h3>
  );
}

export function BulletList({ items = [] }) {
  return (
    <ul className="my-5 space-y-3">
      {items.map((it, i) => (
        <li key={i} className="relative pl-6 text-[16.5px] leading-[1.75] text-obsidian-800 sm:text-[17px]">
          <span aria-hidden className="absolute left-1 top-[0.72em] h-1.5 w-1.5 rounded-full bg-cobalt" />
          <Inline text={it} />
        </li>
      ))}
    </ul>
  );
}

export function NumberList({ items = [] }) {
  return (
    <ol className="my-6 space-y-3.5">
      {items.map((it, i) => (
        <li key={i} className="relative pl-10 text-[16.5px] leading-[1.75] text-obsidian-800 sm:text-[17px]">
          <span aria-hidden className="absolute left-0 top-[0.2em] flex h-6 w-6 items-center justify-center rounded-full bg-obsidian font-mono text-[11px] font-semibold text-white">
            {i + 1}
          </span>
          <Inline text={it} />
        </li>
      ))}
    </ol>
  );
}

// Tabel sempit (≤3 kolom) dibiarkan membungkus teks di ponsel; tabel lebar boleh digulir ke samping.
const minWidth = (cols) => (cols >= 5 ? 'min-w-[600px]' : cols === 4 ? 'min-w-[520px]' : '');

export function DataTable({ head = [], rows = [], className }) {
  return (
    <div className={cn('my-7 overflow-x-auto rounded-2xl ring-1 ring-inset ring-mist-100', className)}>
      <table className={cn('w-full border-collapse text-left', minWidth(Math.max(head.length, rows[0]?.length || 0)))}>
        {head.length > 0 && (
          <thead>
            <tr className="bg-ghost">
              {head.map((h, i) => (
                <th key={i} scope="col" className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-mist-700 first:pl-5 last:pr-5">
                  <Inline text={h} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className={cn('border-t border-mist-100', !head.length && 'first:border-t-0')}>
              {row.map((cell, c) =>
                c === 0 ? (
                  <th key={c} scope="row" className="px-4 py-3.5 pl-5 align-top text-[15px] font-semibold text-obsidian">
                    <Inline text={cell} />
                  </th>
                ) : (
                  <td key={c} className="px-4 py-3.5 align-top text-[15px] leading-relaxed text-obsidian-800 last:pr-5">
                    <Inline text={cell} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TONES = {
  info: { box: 'bg-cobalt-50/70 ring-cobalt-100', icon: 'bg-white text-cobalt ring-cobalt-100', Icon: Info, label: 'Info' },
  tip: { box: 'bg-mint-50 ring-mint-100', icon: 'bg-white text-mint-700 ring-mint-100', Icon: Lightbulb, label: 'Tips' },
  warning: { box: 'bg-warning-50 ring-warning/25', icon: 'bg-white text-warning-700 ring-warning/25', Icon: TriangleAlert, label: 'Perhatian' },
};

/** Kotak catatan. tone: info | tip | warning · flush: tanpa margin bawaan (atur lewat className). */
export function Callout({ tone = 'info', title, text, flush, className }) {
  const t = TONES[tone] || TONES.info;
  const Icon = t.Icon;
  return (
    <aside className={cn('flex gap-4 rounded-2xl p-5 ring-1 ring-inset sm:p-6', !flush && 'my-7', t.box, className)} aria-label={title || t.label}>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', t.icon)}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 pt-1">
        {title && <p className="text-[15px] font-semibold leading-snug text-obsidian">{title}</p>}
        {text && (
          <p className={cn('text-[15.5px] leading-relaxed text-obsidian-800', title && 'mt-1.5')}>
            <Inline text={text} />
          </p>
        )}
      </div>
    </aside>
  );
}

const LABEL_TONE = {
  TWK: 'bg-cobalt-50 text-cobalt-700',
  TIU: 'bg-warning-50 text-warning-700',
  TKP: 'bg-mint-50 text-mint-700',
};

/**
 * Kartu soal latihan: opsi A–E + jawaban/pembahasan di <details> (tetap ada di HTML).
 * Saat pembahasan dibuka, opsi jawaban ikut disorot (CSS :has, tanpa JS).
 */
export function QuestionCard({ label, number, text, options = [], answer, explanation }) {
  const key = String(answer || '').trim().toUpperCase().charAt(0);
  const isTkp = String(label || '').toUpperCase() === 'TKP';
  return (
    <div className="group/q my-7 rounded-[20px] bg-mist-50 p-5 ring-1 ring-inset ring-mist-100 sm:p-6">
      <div className="flex items-center gap-2.5">
        {label && <span className={cn('inline-flex h-7 items-center rounded-full px-2.5 text-xs font-semibold', LABEL_TONE[String(label).toUpperCase()] || 'bg-ghost text-mist-700')}>{label}</span>}
        {number != null && <span className="font-mono text-xs font-semibold text-mist-700">Soal {String(number).padStart(2, '0')}</span>}
      </div>
      <p className="mt-3.5 text-[16.5px] font-medium leading-[1.7] text-obsidian sm:text-[17px]">
        <Inline text={text} />
      </p>
      <ol className="mt-4 space-y-2" aria-label="Pilihan jawaban">
        {options.map((raw, i) => {
          const { letter, text: optText } = splitOption(raw, i);
          const correct = letter === key;
          return (
            <li
              key={i}
              className={cn(
                'flex items-start gap-3 rounded-xl bg-white px-3.5 py-3 ring-1 ring-inset ring-mist-100 transition-colors',
                correct && 'group-has-[details[open]]/q:bg-mint-50 group-has-[details[open]]/q:ring-mint-700/40',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ghost font-mono text-[13px] font-semibold text-obsidian-600',
                  correct && 'group-has-[details[open]]/q:bg-mint group-has-[details[open]]/q:text-obsidian',
                )}
              >
                {letter}
              </span>
              <span className="pt-0.5 text-[15.5px] leading-relaxed text-obsidian-800">
                <span className="sr-only">{letter}. </span>
                <Inline text={optText} />
              </span>
            </li>
          );
        })}
      </ol>
      <details className="group/d mt-4 rounded-xl bg-white ring-1 ring-inset ring-mist-100">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-[14.5px] font-semibold text-obsidian hover:bg-mist-50 [&::-webkit-details-marker]:hidden">
          <span>Lihat jawaban &amp; pembahasan</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-mist-700 transition-transform duration-200 group-open/d:rotate-180" aria-hidden />
        </summary>
        <div className="border-t border-mist-100 px-4 pb-4 pt-3.5">
          {key && (
            <p className="text-[15px] font-semibold text-obsidian">
              {isTkp ? 'Pilihan terbaik' : 'Jawaban'}:{' '}
              <span className="ml-1 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-mint px-1.5 font-mono text-[13px] text-obsidian">{key}</span>
            </p>
          )}
          {explanation && (
            <p className="mt-2.5 text-[15.5px] leading-[1.75] text-obsidian-800">
              <Inline text={explanation} />
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

/** Render satu blok sesuai type. `number` dipakai untuk soal. */
export function Block({ block, number }) {
  if (!block || typeof block !== 'object') return null;
  switch (block.type) {
    case 'p':
      return <Paragraph text={block.text} />;
    case 'h3':
      return <SubHeading text={block.text} />;
    case 'ul':
      return <BulletList items={block.items} />;
    case 'ol':
      return <NumberList items={block.items} />;
    case 'table':
      return <DataTable head={block.head} rows={block.rows} />;
    case 'callout':
      return <Callout tone={block.tone} title={block.title} text={block.text} />;
    case 'question':
      return <QuestionCard {...block} number={number} />;
    default:
      return block.text ? <Paragraph text={block.text} /> : null;
  }
}
