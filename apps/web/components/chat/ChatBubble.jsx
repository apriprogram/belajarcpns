'use client';

/* eslint-disable @next/next/no-img-element -- lampiran chat dari /uploads (ukuran tidak diketahui) */
import { Fragment, memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, FileText, Image as ImageIcon, MoreHorizontal, Music, Pin, PinOff, Plus, Reply, SmilePlus, Star, Trash2, Video } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui';
import { formatUkuranFile } from '@/components/ui/FileUpload';
import { EMOJI_ONLY_RE, QUICK_REACTIONS, jam, snippet, tokenize } from './chat-utils';

/** Ikon kecil jenis lampiran (kutipan, banner sematan, pratinjau balasan). */
export function KindIcon({ kind, className }) {
  const Icon = kind === 'image' ? ImageIcon : kind === 'video' ? Video : kind === 'audio' ? Music : FileText;
  return <Icon className={className} aria-hidden />;
}

/** Teks dengan tautan yang bisa diklik dan @tag yang disorot. */
function RichText({ text, mentions, mine, meId }) {
  const parts = useMemo(() => tokenize(text, mentions), [text, mentions]);
  return parts.map((p, i) => {
    if (p.t === 'url') {
      return (
        <a key={i} href={p.v} target="_blank" rel="noopener noreferrer nofollow" className={cn('break-all underline underline-offset-2', mine ? 'text-white' : 'text-cobalt-700')} onClick={(e) => e.stopPropagation()}>
          {p.v}
        </a>
      );
    }
    if (p.t === 'mention') {
      return (
        <span key={i} className={cn('font-semibold', mine ? 'text-white underline decoration-white/50 underline-offset-2' : 'text-cobalt-700', !mine && p.id === meId && 'rounded bg-cobalt-100 px-0.5')}>
          {p.v}
        </span>
      );
    }
    return <Fragment key={i}>{p.v}</Fragment>;
  });
}

function Attachment({ file, kind, mine }) {
  if (kind === 'image') {
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="block overflow-hidden rounded-xl">
        <img src={file.url} alt={file.name} loading="lazy" className="max-h-64 w-full bg-ghost object-cover" />
      </a>
    );
  }
  if (kind === 'video') return <video src={file.url} controls preload="metadata" className="max-h-64 w-full rounded-xl bg-black" onClick={(e) => e.stopPropagation()} />;
  if (kind === 'audio') return <audio src={file.url} controls preload="metadata" className="h-10 w-full min-w-[220px]" onClick={(e) => e.stopPropagation()} />;
  return (
    <a
      href={file.url}
      download={file.name}
      onClick={(e) => e.stopPropagation()}
      className={cn('flex items-center gap-3 rounded-xl p-2.5 pr-3', mine ? 'bg-white/15 hover:bg-white/20' : 'bg-ghost hover:bg-mist-100')}
    >
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', mine ? 'bg-white/20' : 'bg-white ring-1 ring-mist-100')}>
        <FileText className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{file.name}</span>
        <span className={cn('text-[11px]', mine ? 'text-white/70' : 'text-mist-700')}>
          {formatUkuranFile(file.size)} · {(file.name.split('.').pop() || '').toUpperCase()}
        </span>
      </span>
      <Download className="h-4 w-4 shrink-0 opacity-70" />
    </a>
  );
}

/** Kutipan pesan yang dibalas; klik → gulir & sorot pesan asli. */
function ReplyQuote({ r, mine, onJump }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onJump();
      }}
      aria-label={`Lihat pesan ${r.user_name} yang dibalas`}
      className={cn(
        'mb-1.5 flex w-full min-w-0 flex-col items-start rounded-xl border-l-[3px] px-2.5 py-1.5 text-left text-xs leading-snug transition-colors focus-visible:outline-none focus-visible:ring-2',
        mine ? 'border-white/70 bg-white/15 hover:bg-white/20 focus-visible:ring-white' : 'border-cobalt bg-ghost hover:bg-mist-100 focus-visible:ring-cobalt',
      )}
    >
      <span className={cn('max-w-full truncate font-semibold', mine ? 'text-white' : 'text-cobalt-700')}>{r.user_name}</span>
      <span className={cn('flex w-full min-w-0 items-start gap-1', mine ? 'text-white/80' : 'text-mist-700', r.deleted && 'italic')}>
        {!r.deleted && r.kind && r.kind !== 'text' && <KindIcon kind={r.kind} className="mt-0.5 h-3 w-3 shrink-0" />}
        <span className="line-clamp-2 break-words">{snippet(r)}</span>
      </span>
    </button>
  );
}

/** Bilah reaksi cepat ala WhatsApp: 👍 ❤️ 😂 😮 😢 🙏 + tombol "+" (pemilih lengkap). */
function QuickReactions({ mine, myEmoji, canMore, flip, onReact, onMore }) {
  const ref = useRef(null);
  // Fokus pindah ke emoji pertama (tombol pemicu di toolbar aksi ikut tersembunyi).
  useEffect(() => {
    ref.current?.querySelector('button')?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Reaksi cepat"
      onClick={(e) => e.stopPropagation()}
      className={cn('absolute z-20 flex animate-scale-in items-center gap-0.5 rounded-full bg-white p-1 shadow-float ring-1 ring-mist-100', flip ? 'top-full mt-1.5' : 'bottom-full mb-1.5', mine ? 'right-0' : 'left-0')}
    >
      {QUICK_REACTIONS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onReact(e)}
          aria-label={myEmoji === e ? `Hapus reaksi ${e}` : `Beri reaksi ${e}`}
          aria-pressed={myEmoji === e}
          className={cn('flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt sm:h-9 sm:w-9 sm:text-xl', myEmoji === e && 'bg-cobalt-50 ring-1 ring-cobalt/40')}
        >
          {e}
        </button>
      ))}
      {canMore && (
        <button
          type="button"
          onClick={onMore}
          aria-label="Pilih emoji lain"
          title="Emoji lain"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-ghost text-obsidian-600 transition-colors hover:bg-mist-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt sm:h-9 sm:w-9"
        >
          <Plus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Chip reaksi di bawah gelembung: emoji + jumlah; milik saya disorot; title = nama yang bereaksi. */
function ReactionChips({ reactions, meId, mine, canReact, onToggle }) {
  return (
    <div className={cn('relative z-[1] -mt-1 flex max-w-full flex-wrap gap-1 px-1', mine ? 'justify-end' : 'justify-start')}>
      {reactions.map((r) => {
        const users = r.users || [];
        const isMine = users.some((u) => u.id === meId);
        const names = users.map((u) => (u.id === meId ? 'Anda' : u.name));
        const extra = r.count - names.length;
        const who = names.join(', ') + (extra > 0 ? ` dan ${extra} lainnya` : '');
        const cls = cn(
          'inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs shadow-soft ring-1 transition-colors',
          isMine ? 'bg-cobalt-50 text-cobalt-700 ring-cobalt/40' : 'bg-white text-obsidian-600 ring-mist-100',
        );
        const inner = (
          <>
            <span className="text-sm leading-none" aria-hidden>
              {r.emoji}
            </span>
            <span className="font-medium tabular-nums" aria-hidden>
              {r.count}
            </span>
            <span className="sr-only">
              {r.emoji} {r.count} reaksi dari {who}
            </span>
          </>
        );
        if (!canReact) {
          return (
            <span key={r.emoji} title={who} className={cls}>
              {inner}
            </span>
          );
        }
        return (
          <button
            key={r.emoji}
            type="button"
            title={who}
            aria-pressed={isMine}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(r.emoji);
            }}
            className={cn(cls, 'hover:ring-cobalt/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt')}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}

/** Tombol di toolbar aksi; hanya masuk urutan Tab saat toolbar dibuka (lewat tombol "Aksi pesan"). */
function MsgAction({ label, onClick, danger, focusable, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      tabIndex={focusable ? 0 : -1}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn('flex h-7 w-7 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt', danger ?'text-danger-700 hover:bg-danger-50' : 'text-obsidian-600 hover:bg-ghost')}
    >
      {children}
    </button>
  );
}

/**
 * Satu gelembung pesan. Di-memo: aksi lewat `onAction(type, m, arg)` yang stabil dari GroupChat.
 * type: activate | toggleActions | jump | reactBar | react | reactMore | reply | star | copy | pin | delete
 * Keyboard: gelembung bukan tombol (isinya bisa berisi tautan/kutipan); tombol "Aksi pesan" (tampil saat fokus)
 * membuka/menutup toolbar aksi lalu memindahkan fokus ke aksi pertama.
 */
export const Bubble = memo(function Bubble({ m, meId, mine, grouped, active, highlighted, reacting, perms, canDelete, onAction }) {
  const anchorRef = useRef(null);
  const barRef = useRef(null);
  const focusBar = useRef(false);
  const barId = `gc-act-${m.id}`;
  const [flip, setFlip] = useState(false);

  // Toolbar dibuka lewat keyboard → fokus ke aksi pertama.
  useEffect(() => {
    if (active && focusBar.current) barRef.current?.querySelector('button')?.focus({ preventScroll: true });
    focusBar.current = false;
  }, [active]);
  const emojiOnly = !m.file && !m.reply_to && m.body && EMOJI_ONLY_RE.test(m.body) && [...m.body.replace(/\s/g, '')].length <= 8;
  const mentionsMe = !mine && !m.deleted && (m.mentions || []).some((x) => x.id === meId);
  const myEmoji = useMemo(() => (m.reactions || []).find((r) => (r.users || []).some((u) => u.id === meId))?.emoji || null, [m.reactions, meId]);
  const media = m.file && (m.kind === 'image' || m.kind === 'video');

  // Bilah reaksi dibalik ke bawah bila terlalu dekat tepi atas daftar.
  useLayoutEffect(() => {
    if (!reacting || !anchorRef.current) return;
    const list = anchorRef.current.closest('[data-gc-list]');
    if (!list) return;
    setFlip(anchorRef.current.getBoundingClientRect().top - list.getBoundingClientRect().top < 56);
  }, [reacting]);

  return (
    <div
      data-mid={m.id}
      className={cn('group/msg -mx-3 flex gap-2 px-3 transition-colors duration-700', mine ? 'justify-end' : 'justify-start', grouped ? 'mt-1' : 'mt-3', highlighted && 'bg-cobalt-100/70')}
    >
      {!mine && <span className="w-8 shrink-0">{!grouped && <Avatar name={m.user.name} src={m.user.avatar_url} size="sm" />}</span>}
      <div className={cn('relative flex max-w-[80%] flex-col', mine ? 'items-end' : 'items-start')}>
        {!mine && !grouped && (
          <span className="mb-1 flex items-center gap-1.5 px-1 text-xs">
            <span className="font-semibold text-obsidian">{m.user.name}</span>
            {m.user.role === 'admin' && <span className="rounded-md bg-cobalt-50 px-1.5 py-px text-[10px] font-semibold text-cobalt-700">Admin</span>}
          </span>
        )}

        <div ref={anchorRef} className={cn('relative flex max-w-full flex-col', mine ? 'items-end' : 'items-start')}>
          {reacting && !m.deleted && (
            <QuickReactions
              mine={mine}
              myEmoji={myEmoji}
              canMore={perms.reactMore}
              flip={flip}
              onReact={(e) => onAction('react', m, e)}
              onMore={() => onAction('reactMore', m)}
            />
          )}
          {!m.deleted && (
            <button
              type="button"
              data-msg-actions
              aria-label={`Aksi pesan ${mine ? 'Anda' : m.user.name}, ${jam(m.created_at)}`}
              aria-expanded={active && !reacting}
              aria-controls={active && !reacting ? barId : undefined}
              onClick={(e) => {
                e.stopPropagation();
                focusBar.current = !active && e.detail === 0; // Enter/Space (bukan klik mouse)
                onAction('toggleActions', m);
              }}
              className={cn(
                'pointer-events-none absolute top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-obsidian-600 opacity-0 shadow-float ring-1 ring-mist-100 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt',
                mine ? 'right-full mr-1.5' : 'left-full ml-1.5',
              )}
            >
              <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
          {/* Klik/sentuh gelembung → tampilkan aksi (keyboard memakai tombol "Aksi pesan" di atas). */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onAction('activate', m);
            }}
            className={cn(
              'relative min-w-[64px] max-w-full text-left text-sm leading-relaxed',
              m.deleted
                ? 'rounded-2xl bg-white/70 px-3.5 py-2 italic text-mist-700 ring-1 ring-mist-100'
                : emojiOnly
                  ? 'px-1 text-4xl leading-tight'
                  : cn(
                      'rounded-2xl',
                      media ? 'p-1' : 'px-3.5 py-2',
                      m.reply_to && 'min-w-[160px]',
                      mine ? 'rounded-br-md bg-cobalt text-white' : cn('rounded-bl-md text-obsidian ring-1', mentionsMe ? 'bg-cobalt-50 ring-cobalt/30' : 'bg-white ring-mist-100'),
                    ),
            )}
          >
            {m.deleted ? (
              'Pesan ini telah dihapus'
            ) : (
              <>
                {mentionsMe && <span className="sr-only">Menandai Anda. </span>}
                {m.reply_to && <ReplyQuote r={m.reply_to} mine={mine} onJump={() => onAction('jump', m, m.reply_to.id)} />}
                {m.file && <Attachment file={m.file} kind={m.kind} mine={mine} />}
                {m.body && (
                  <p className={cn('whitespace-pre-wrap break-words', media && 'px-2.5 pb-1 pt-2', m.file && !media && 'mt-2')}>
                    <RichText text={m.body} mentions={m.mentions} mine={mine} meId={meId} />
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {!m.deleted && m.reactions?.length > 0 && <ReactionChips reactions={m.reactions} meId={meId} mine={mine} canReact={perms.react} onToggle={(e) => onAction('react', m, e)} />}

        <span className={cn('mt-1 flex items-center gap-1 px-1 text-[10px] text-mist-700', mine && 'flex-row-reverse')}>
          {jam(m.created_at)}
          {m.pinned && !m.deleted && (
            <span className="inline-flex items-center text-cobalt-700" title={m.pinned_by_name ? `Disematkan ${m.pinned_by_name}` : 'Disematkan'}>
              <Pin className="h-3 w-3" aria-hidden />
              <span className="sr-only">Disematkan</span>
            </span>
          )}
          {m.starred && (
            <span className="inline-flex items-center gap-0.5 text-warning-700" title={m.starred_by_name ? `Dibintangi ${m.starred_by_name}` : 'Berbintang'}>
              <Star className="h-3 w-3 fill-warning text-warning" aria-hidden />
              <span className="sr-only">Berbintang</span>
            </span>
          )}
        </span>

        {/* Aksi: muncul saat hover / disentuh (disembunyikan selama bilah reaksi terbuka) */}
        {!m.deleted && !reacting && (
          <div
            ref={barRef}
            id={barId}
            role="toolbar"
            aria-label="Aksi pesan"
            className={cn(
              'absolute -top-3 z-10 flex items-center gap-0.5 rounded-full bg-white p-0.5 shadow-float ring-1 ring-mist-100 transition-opacity',
              mine ? 'right-1' : 'left-1',
              active ? 'opacity-100' : 'pointer-events-none opacity-0 group-hover/msg:pointer-events-auto group-hover/msg:opacity-100',
            )}
          >
            {perms.react && (
              <MsgAction label="Beri reaksi" focusable={active} onClick={() => onAction('reactBar', m)}>
                <SmilePlus className="h-3.5 w-3.5" />
              </MsgAction>
            )}
            {perms.reply && (
              <MsgAction label="Balas" focusable={active} onClick={() => onAction('reply', m)}>
                <Reply className="h-3.5 w-3.5" />
              </MsgAction>
            )}
            {perms.star && (
              <MsgAction label={m.starred ? 'Hapus bintang' : 'Beri bintang'} focusable={active} onClick={() => onAction('star', m)}>
                <Star className={cn('h-3.5 w-3.5', m.starred && 'fill-warning text-warning')} />
              </MsgAction>
            )}
            {m.body && (
              <MsgAction label="Salin teks" focusable={active} onClick={() => onAction('copy', m)}>
                <Copy className="h-3.5 w-3.5" />
              </MsgAction>
            )}
            {perms.admin && (
              <MsgAction label={m.pinned ? 'Lepas sematan' : 'Sematkan pesan'} focusable={active} onClick={() => onAction('pin', m)}>
                {m.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </MsgAction>
            )}
            {canDelete && (
              <MsgAction label="Hapus pesan" focusable={active} onClick={() => onAction('delete', m)} danger>
                <Trash2 className="h-3.5 w-3.5" />
              </MsgAction>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default Bubble;
