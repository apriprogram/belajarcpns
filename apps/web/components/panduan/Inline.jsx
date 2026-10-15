import { Fragment } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

/*
 * Teks inline artikel: `**tebal**` → <strong>, `[label](url)` → <Link> (internal) atau <a target=_blank> (eksternal).
 * Tanpa HTML mentah. Aman dipakai di Server maupun Client Component.
 */

const BOLD_RE = /(\*\*.+?\*\*)/g;
const LINK_RE = /(\[[^\]]+\]\([^)\s]+\))/g;
const LINK_PARTS = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

export const LINK_CLASS = 'font-medium text-cobalt underline decoration-cobalt/30 decoration-1 underline-offset-[3px] transition-colors hover:text-cobalt-700 hover:decoration-cobalt';

/** Tautan pintar: internal ("/…" atau "#…") lewat next/link, eksternal tab baru + rel noopener. */
export function SmartLink({ href, className, children }) {
  const url = String(href || '#');
  if (/^https?:\/\//i.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener" className={cn(LINK_CLASS, className)}>
        {children}
      </a>
    );
  }
  return (
    <Link href={url} className={cn(LINK_CLASS, className)}>
      {children}
    </Link>
  );
}

function withLinks(text, keyBase) {
  return String(text)
    .split(LINK_RE)
    .map((part, i) => {
      if (!part) return null;
      const m = LINK_PARTS.exec(part);
      if (m) {
        return (
          <SmartLink key={`${keyBase}-${i}`} href={m[2]}>
            {m[1]}
          </SmartLink>
        );
      }
      return <Fragment key={`${keyBase}-${i}`}>{part}</Fragment>;
    });
}

/** Render teks dengan penanda inline. */
export function Inline({ text }) {
  if (text == null || text === '') return null;
  return String(text)
    .split(BOLD_RE)
    .map((part, i) => {
      if (!part) return null;
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-obsidian">
            {withLinks(part.slice(2, -2), i)}
          </strong>
        );
      }
      return <Fragment key={i}>{withLinks(part, i)}</Fragment>;
    });
}

export default Inline;
