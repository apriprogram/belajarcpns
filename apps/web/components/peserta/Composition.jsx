import { cn } from '@/lib/cn';
import { SUBTEST_TONE } from './constants';

/** Bar komposisi bersegmen TWK/TIU/TKP + legenda. counts: { TWK, TIU, TKP } */
export function Composition({ counts = {}, className, legend = true }) {
  const items = ['TWK', 'TIU', 'TKP'].map((k) => ({ k, n: Number(counts[k]) || 0 }));
  const total = items.reduce((s, x) => s + x.n, 0);
  return (
    <div className={cn('w-full', className)}>
      <div className="flex h-2 w-full gap-1" role="img" aria-label={`Komposisi: ${items.map((x) => `${x.k} ${x.n}`).join(', ')}`}>
        {total === 0 ? (
          <span className="flex-1 rounded-full bg-mist-100" />
        ) : (
          items
            .filter((x) => x.n > 0)
            .map((x) => <span key={x.k} className={cn('rounded-full', SUBTEST_TONE[x.k].fill)} style={{ flexGrow: x.n, flexBasis: 0 }} />)
        )}
      </div>
      {legend && (
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mist-700">
          {items.map((x) => (
            <span key={x.k} className={cn('inline-flex items-center gap-1.5', !x.n && 'opacity-50')}>
              <span className={cn('h-2 w-2 rounded-full', x.n ? SUBTEST_TONE[x.k].fill : 'bg-mist')} aria-hidden />
              {x.k} <span className="font-mono font-semibold tabular-nums text-obsidian">{x.n}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Composition;
