import { Fragment } from 'react';

/** Teks sederhana dengan penanda `**tebal**` → <b>. Tanpa HTML mentah (aman untuk konten CMS). */
export function RichText({ text, boldClassName }) {
  if (!text) return null;
  return String(text)
    .split(/\*\*(.+?)\*\*/g)
    .map((part, i) =>
      i % 2 ? (
        <b key={i} className={boldClassName}>
          {part}
        </b>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      ),
    );
}

export default RichText;
