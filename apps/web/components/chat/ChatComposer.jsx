'use client';

/* eslint-disable @next/next/no-img-element -- pratinjau lampiran lokal (blob URL) */
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileText, Loader2, Paperclip, Reply, SendHorizontal, Smile, TriangleAlert, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { Avatar, useToast } from '@/components/ui';
import { formatUkuranFile } from '@/components/ui/FileUpload';
import { KindIcon } from './ChatBubble';
import { EmojiPicker } from './EmojiPicker';
import { ATTACH_LABEL, HAS_URL_RE, MAX_BODY, MAX_FILE, extKind, mentionIds, mentionQuery, snippet } from './chat-utils';

const MEMBER_LIMIT = 20; // batas hasil GET /chat/members

const extOf = (name) => `.${(name.split('.').pop() || '').toLowerCase()}`;

function joinOr(list) {
  if (list.length <= 1) return list[0] || '';
  return `${list.slice(0, -1).join(', ')}, atau ${list[list.length - 1]}`;
}

/**
 * Komposer GroupChat: teks + emoji + lampiran + balasan (kutipan) + @tag dengan autocomplete.
 * perms: { emoji, mention, links, accept: string[], attachKinds: string[] }
 * onSend({ body, file, replyTo, mentions }) → Promise<boolean> (true = terkirim, komposer dikosongkan)
 */
export function ChatComposer({ inputRef, visible, perms, meId, replyTo, onCancelReply, onSend, onApiError }) {
  const toast = useToast();
  const listId = useId();
  const fileRef = useRef(null);
  const cache = useRef(new Map());
  const errRef = useRef(onApiError);
  useEffect(() => {
    errRef.current = onApiError;
  });

  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [caret, setCaret] = useState(null);
  const [picked, setPicked] = useState([]);
  const [dismissedAt, setDismissedAt] = useState(null);
  const [results, setResults] = useState(null);
  const [active, setActive] = useState(0);

  // ---------- @tag ----------
  const raw = useMemo(() => (perms.mention ? mentionQuery(text, caret, picked, null) : null), [perms.mention, text, caret, picked]);
  const mq = raw && raw.at !== dismissedAt ? raw : null;
  const key = mq ? mq.q.toLowerCase() : null;

  useEffect(() => {
    if (dismissedAt != null && (!raw || raw.at !== dismissedAt)) setDismissedAt(null);
  }, [raw, dismissedAt]);

  useEffect(() => {
    if (key == null) return undefined;
    // Pakai cache: hasil prefiks yang lengkap (< batas) cukup difilter lokal.
    const hit = cache.current.get(key);
    if (hit) {
      setResults({ key, items: hit });
      return undefined;
    }
    for (const [k, items] of cache.current) {
      if (key.startsWith(k) && items.length < MEMBER_LIMIT) {
        setResults({ key, items: items.filter((u) => u.name.toLowerCase().includes(key)) });
        return undefined;
      }
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await api.get('/chat/members', { query: { q: key }, signal: ctl.signal });
        const items = Array.isArray(r) ? r : r?.items || [];
        if (cache.current.size > 50) cache.current.clear();
        cache.current.set(key, items);
        setResults({ key, items });
      } catch (err) {
        if (err?.name !== 'AbortError') errRef.current?.(err);
      }
    }, 160);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [key]);

  useEffect(() => setActive(0), [key]);

  const members = useMemo(() => {
    if (key == null || !results) return [];
    return results.items.filter((u) => u.id !== meId && u.name.toLowerCase().includes(key)).slice(0, MEMBER_LIMIT);
  }, [results, key, meId]);
  const mentionOpen = !!mq && !emojiOpen && members.length > 0;
  const act = Math.min(active, Math.max(0, members.length - 1));

  useEffect(() => {
    if (!mentionOpen) return;
    document.getElementById(`${listId}-${act}`)?.scrollIntoView({ block: 'nearest' });
  }, [mentionOpen, act, listId]);

  const pickMention = (u) => {
    if (!mq) return;
    const ins = `@${u.name} `;
    const end = mq.at + 1 + mq.q.length;
    const next = text.slice(0, mq.at) + ins + text.slice(end);
    if (next.length > MAX_BODY) return;
    const pos = mq.at + ins.length;
    setText(next);
    setCaret(pos);
    setPicked((list) => (list.some((p) => p.id === u.id) ? list : [...list, { id: u.id, name: u.name }]));
    requestAnimationFrame(() => {
      const ta = inputRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  // ---------- Lampiran ----------
  const pickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_FILE) {
      toast.error('File terlalu besar', 'Ukuran maksimal 10 MB.');
      return;
    }
    const ext = extOf(f.name);
    const kind = extKind(ext);
    if (!kind) {
      toast.error('Jenis file tidak didukung', `Kirim ${joinOr(perms.attachKinds.map((k) => ATTACH_LABEL[k]))}.`);
      return;
    }
    if (!perms.accept.includes(ext)) {
      toast.error('Lampiran dinonaktifkan', `Mengirim ${ATTACH_LABEL[kind]} sedang dinonaktifkan admin.`);
      return;
    }
    setFile({ f, preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null });
  };
  const clearFile = () => {
    if (file?.preview) URL.revokeObjectURL(file.preview);
    setFile(null);
  };

  // Jenis lampiran yang sedang dipilih dinonaktifkan admin → buang dari komposer.
  const fileBlocked = !!file && !perms.accept.includes(extOf(file.f.name));
  const dropBlockedFile = () => {
    toast.warning('Lampiran jenis ini dinonaktifkan admin', `${file.f.name} dihapus dari pesan.`);
    clearFile();
  };
  const dropRef = useRef(dropBlockedFile);
  useEffect(() => {
    dropRef.current = dropBlockedFile;
  });
  useEffect(() => {
    if (fileBlocked) dropRef.current();
  }, [fileBlocked]);

  // ---------- Kirim ----------
  const blockedLink = !perms.links && HAS_URL_RE.test(text);
  const submit = async () => {
    const body = text.trim();
    if ((!body && !file) || sending) return;
    if (blockedLink) {
      toast.warning('Link tidak dapat dikirim', 'Mengirim link sedang dinonaktifkan admin.');
      return;
    }
    if (fileBlocked) {
      dropBlockedFile();
      return;
    }
    // Simpan apa yang dikirim: ketikan / lampiran / tag baru selama menunggu server tidak ikut terhapus.
    const sentText = text;
    const sentFile = file;
    const sentPicked = picked;
    setSending(true);
    const ok = await onSend({ body, file: file ? file.f : null, replyTo: replyTo ? replyTo.id : null, mentions: perms.mention ? mentionIds(body, picked) : [] });
    setSending(false);
    if (!ok) return;
    setText((cur) => (cur.startsWith(sentText) ? cur.slice(sentText.length).replace(/^\s+/, '') : cur));
    setCaret(null);
    setPicked((cur) => (cur === sentPicked ? [] : cur)); // ada tag baru selama mengirim → biarkan
    setDismissedAt(null);
    if (sentFile?.preview) URL.revokeObjectURL(sentFile.preview);
    setFile((cur) => (cur === sentFile ? null : cur));
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      const ta = inputRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    });
  };

  const insertEmoji = (e) => {
    const ta = inputRef.current;
    if (!ta) {
      setText((t) => t + e);
      return;
    }
    const { selectionStart: a, selectionEnd: b } = ta;
    const next = text.slice(0, a) + e + text.slice(b);
    if (next.length > MAX_BODY) return;
    setText(next);
    setCaret(a + e.length);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(a + e.length, a + e.length);
    });
  };

  // Escape menutup pemilih emoji lebih dulu (fase capture → panel tidak ikut tertutup).
  useEffect(() => {
    if (!emojiOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      setEmojiOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [emojiOpen]);

  // Tinggi textarea mengikuti isi (maks ±5 baris).
  useLayoutEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [text, visible, inputRef]);

  const syncCaret = (el) => setCaret(el.selectionStart === el.selectionEnd ? el.selectionStart : null);

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && e.nativeEvent.defaultPrevented) return; // sudah ditangani (mis. pemilih emoji)
    if (mentionOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const d = e.key === 'ArrowDown' ? 1 : -1;
        setActive((act + d + members.length) % members.length);
        return;
      }
      if ((e.key === 'Enter' || e.key === 'Tab') && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        pickMention(members[act]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setDismissedAt(mq.at);
        return;
      }
    }
    if (e.key === 'Escape' && replyTo) {
      e.preventDefault();
      onCancelReply();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const canAttach = perms.accept.length > 0;

  return (
    <div className="relative border-t border-mist-100 bg-white p-3">
      {emojiOpen && <EmojiPicker onPick={insertEmoji} className="absolute inset-x-3 bottom-full mb-2" />}

      {mentionOpen && (
        <div
          id={listId}
          role="listbox"
          aria-label="Tandai anggota"
          onMouseDown={(e) => e.preventDefault()} // seret scrollbar tidak memindahkan fokus dari textarea
          className="absolute inset-x-3 bottom-full mb-2 max-h-56 animate-scale-in overflow-y-auto rounded-2xl bg-white p-1.5 shadow-float ring-1 ring-mist-100">
          {members.map((u, k) => (
            <div
              key={u.id}
              id={`${listId}-${k}`}
              role="option"
              aria-selected={k === act}
              onMouseDown={(e) => {
                e.preventDefault(); // fokus tetap di textarea
                pickMention(u);
              }}
              onMouseEnter={() => setActive(k)}
              className={cn('flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm', k === act && 'bg-ghost')}
            >
              <Avatar name={u.name} src={u.avatar_url} size="xs" />
              <span className="min-w-0 flex-1 truncate font-medium">{u.name}</span>
              {u.role === 'admin' && <span className="rounded-md bg-cobalt-50 px-1.5 py-px text-[10px] font-semibold text-cobalt-700">Admin</span>}
            </div>
          ))}
        </div>
      )}

      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-2xl bg-ghost p-2 pl-3">
          <Reply className="h-4 w-4 shrink-0 text-cobalt" aria-hidden />
          <div className="min-w-0 flex-1 border-l-[3px] border-cobalt pl-2">
            <p className="truncate text-xs font-semibold text-cobalt-700">Membalas {replyTo.user.id === meId ? 'pesan Anda' : replyTo.user.name}</p>
            <p className="flex min-w-0 items-center gap-1 text-xs text-mist-700">
              {replyTo.kind && replyTo.kind !== 'text' && <KindIcon kind={replyTo.kind} className="h-3 w-3 shrink-0" />}
              <span className="truncate">{snippet(replyTo)}</span>
            </p>
          </div>
          <button type="button" onClick={onCancelReply} aria-label="Batalkan balasan" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-mist-700 hover:bg-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {file && (
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-ghost p-2 pr-3">
          {file.preview ? (
            <img src={file.preview} alt="" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-obsidian-600 ring-1 ring-mist-100">
              <FileText className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.f.name}</p>
            <p className="text-xs text-mist-700">{formatUkuranFile(file.f.size)}</p>
          </div>
          <button type="button" onClick={clearFile} aria-label="Batalkan lampiran" className="flex h-8 w-8 items-center justify-center rounded-full text-mist-700 hover:bg-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {blockedLink && (
        <p role="alert" className="mb-2 flex items-center gap-1.5 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-700">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Mengirim link sedang dinonaktifkan admin. Hapus link untuk mengirim pesan.
        </p>
      )}

      <div className="flex items-end gap-1.5">
        {perms.emoji && (
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            aria-label="Emoji"
            aria-expanded={emojiOpen}
            className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors', emojiOpen ? 'bg-cobalt-50 text-cobalt' : 'text-obsidian-600 hover:bg-ghost')}
          >
            <Smile className="h-5 w-5" />
          </button>
        )}
        {canAttach && (
          <>
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Lampirkan file" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-obsidian-600 transition-colors hover:bg-ghost">
              <Paperclip className="h-5 w-5" />
            </button>
            <input ref={fileRef} type="file" accept={perms.accept.join(',')} className="hidden" onChange={pickFile} />
          </>
        )}
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          maxLength={MAX_BODY}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            syncCaret(e.target);
            if (emojiOpen && v[e.target.selectionStart - 1] === '@' && v.length > text.length) setEmojiOpen(false);
          }}
          onSelect={(e) => syncCaret(e.currentTarget)}
          onBlur={() => setCaret(null)}
          onKeyDown={onKeyDown}
          placeholder="Tulis pesan…"
          aria-label="Tulis pesan"
          aria-autocomplete={perms.mention ? 'list' : undefined}
          aria-controls={mentionOpen ? listId : undefined}
          aria-activedescendant={mentionOpen ? `${listId}-${act}` : undefined}
          className="min-h-10 flex-1 resize-none rounded-2xl bg-ghost px-4 py-2.5 text-sm leading-5 outline-none ring-1 ring-inset ring-transparent transition-shadow placeholder:text-mist-500 focus:bg-white focus:ring-cobalt"
        />
        <button
          type="button"
          onClick={submit}
          disabled={sending || blockedLink || (!text.trim() && !file)}
          aria-label="Kirim pesan"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cobalt text-white transition-colors hover:bg-cobalt-600 disabled:bg-mist-100 disabled:text-mist-500"
        >
          {sending ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <SendHorizontal className="h-[18px] w-[18px]" />}
        </button>
      </div>
    </div>
  );
}

export default ChatComposer;
