'use client';

import { BrandName } from '@/components/layout/Logo';
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, EyeOff, Loader2, Lock, LockOpen, MessagesSquare, Pin, PinOff, RotateCcw, Star, Trash2, X } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useAuth } from '@/components/providers/AuthProvider';
import { ConfirmDialog, useToast } from '@/components/ui';
import { Bubble } from './ChatBubble';
import { ChatComposer } from './ChatComposer';
import { EmojiPicker } from './EmojiPicker';
import { PinnedBanner } from './PinnedBanner';
import { useResizableWidth } from './useResizableWidth';
import { ATTACH_EXT, DEFAULT_CONFIG, SETTINGS_EVENT, acceptList, applyReaction, dayKey, dayLabel, markDeleted, merge, normalizeConfig, sameJSON, setMyReaction, store, ts } from './chat-utils';

const PIN_KEY = 'bisapns:gc-pinned';
const READ_KEY = 'bisapns:gc-last-read'; // + `:${userId}` — per akun (dulu satu kunci untuk semua akun di browser)
const CONFIG_POLL = 30000; // cek ulang /chat/config saat GroupChat dinonaktifkan untuk peserta
const TITLE_RE = /^\(\d+\+?\) /;
const readKey = (id) => `${READ_KEY}:${id}`;

/** Status tab browser (true = tab tidak terlihat). */
function usePageHidden() {
  const [h, setH] = useState(false);
  useEffect(() => {
    const on = () => setH(document.hidden);
    on();
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return h;
}

/** Awali document.title dengan "(N) " selama n > 0; dipasang ulang bila halaman mengganti judul (navigasi). */
function useTitleCount(n) {
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(TITLE_RE, '');
      const want = n > 0 ? `(${n > 99 ? '99+' : n}) ${base}` : base;
      if (document.title !== want) document.title = want;
    };
    apply();
    if (n <= 0) return undefined;
    const mo = new MutationObserver(apply);
    mo.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      mo.disconnect();
      document.title = document.title.replace(TITLE_RE, '');
    };
  }, [n]);
}
/**
 * HP (< 640px): sembunyikan tombol bulat saat halaman digulir ke bawah agar tidak menutupi konten/tombol;
 * muncul lagi saat digulir ke atas atau sudah di dekat dasar halaman (ada ruang kosong di bawah footer).
 */
function useHideOnScrollDown() {
  const [hide, setHide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639.98px)');
    let last = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 120;
      const touring = !!document.querySelector('[role="dialog"][aria-label^="Tur dashboard"]'); // tur onboarding menyorot tombol ini
      if (!mq.matches || y < 80 || nearBottom || touring) setHide(false);
      else if (y > last + 6) setHide(true);
      else if (y < last - 6) setHide(false);
      last = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    mq.addEventListener('change', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      mq.removeEventListener('change', update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return hide;
}

function useIsDesktop() {
  const [d, setD] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setD(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return d;
}

/**
 * GroupChat: obrolan bersama semua peserta & admin.
 * Tombol bulat di kanan bawah membuka panel; panel bisa di-pin (menempel di kanan, konten bergeser).
 * Sinkron via polling ringan. Tidak dipasang di ruang ujian (layout fokus).
 * v2: balas (kutipan), @tag, reaksi emoji, sematan admin, buka/tutup grup, fitur mengikuti `config` server.
 */
export function GroupChat() {
  const { user } = useAuth();
  const toast = useToast();
  const isDesktop = useIsDesktop();
  const fabHidden = useHideOnScrollDown();
  const pageHidden = usePageHidden();
  const { width: panelW, dragging: resizing, handleProps: resizeHandle } = useResizableWidth();
  const meId = user?.id;

  const [open, setOpen] = useState(false);
  const [dockPin, setDockPin] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [pins, setPins] = useState([]);
  const [pinIdx, setPinIdx] = useState(0);
  const [config, setConfig] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);
  const [lastRead, setLastRead] = useState(0);
  const [readFor, setReadFor] = useState(null); // id user pemilik `lastRead` yang sedang dimuat
  const [atBottom, setAtBottom] = useState(true); // daftar pesan digulir sampai bawah
  const [activeId, setActiveId] = useState(null);
  const [reactBar, setReactBar] = useState(null); // id pesan dengan bilah reaksi cepat terbuka
  const [reactPick, setReactPick] = useState(null); // id pesan untuk pemilih reaksi lengkap
  const [replyTo, setReplyTo] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [lockBusy, setLockBusy] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);

  const sinceRef = useRef(null);
  const resetRef = useRef(null);
  const listRef = useRef(null);
  const taRef = useRef(null);
  const stickBottom = useRef(true);
  const prependRef = useRef(null);
  const hasMoreRef = useRef(false);
  const hlTimer = useRef(null);
  const handlers = useRef(null);
  const lockPendRef = useRef(false); // PUT gembok sedang berjalan
  const lockDoneRef = useRef(0); // waktu PUT gembok / perubahan pengaturan terakhir selesai
  const kbRef = useRef(false); // interaksi terakhir di panel lewat keyboard (untuk mengembalikan fokus)
  const wasVisible = useRef(false);
  const syncBusy = useRef(false); // /chat/sync sedang berjalan

  const isAdmin = config?.is_admin ?? user?.role === 'admin';
  // Peserta & GroupChat nonaktif → tidak merender apa pun (FAB pun tidak).
  const hidden = !!user && !isAdmin && config?.enabled === false;
  // Peserta menunggu config pertama agar FAB tidak berkedip saat chat nonaktif.
  const ready = isAdmin || config !== null || !!loadErr;
  const docked = !!user && dockPin && isDesktop && ready && !hidden;
  const visible = (open || docked) && ready && !hidden;
  const groupClosed = config?.group?.peserta_can_send === false;
  const retention = config?.retention_days || 7;

  /** Izin UI turunan config (admin tidak dibatasi). */
  const perms = useMemo(() => {
    const f = config?.features || DEFAULT_CONFIG.features;
    const att = isAdmin ? null : f.attachments;
    const canSend = isAdmin || config?.can_send !== false;
    return {
      admin: isAdmin,
      canSend,
      reply: canSend && (isAdmin || f.replies !== false),
      react: isAdmin || f.reactions !== false,
      reactMore: isAdmin || (f.reactions !== false && f.emoji !== false),
      star: isAdmin || f.stars !== false,
      deleteOwn: isAdmin || f.user_delete !== false,
      mention: isAdmin || f.mentions !== false,
      emoji: isAdmin || f.emoji !== false,
      links: isAdmin || f.links !== false,
      accept: acceptList(att),
      attachKinds: Object.keys(ATTACH_EXT).filter((k) => !att || att[k] !== false),
    };
  }, [config, isAdmin]);

  useEffect(() => {
    setDockPin(store.get(PIN_KEY) === '1');
  }, []);

  // Penanda "terakhir dibaca" per akun. Kunci lama (bersama semua akun) dipindahkan sekali ke akun pertama yang memuatnya.
  useEffect(() => {
    if (!meId) return undefined;
    const key = readKey(meId);
    let v = store.get(key);
    if (v == null) {
      const legacy = store.get(READ_KEY);
      if (legacy != null) {
        v = legacy;
        store.set(key, legacy);
        store.remove(READ_KEY);
      }
    }
    setLastRead(Number(v) || 0);
    setReadFor(meId);
    // Tab lain (akun yang sama) menandai dibaca → ikut perbarui.
    const onStorage = (e) => {
      if (e.key !== key) return;
      const n = Number(e.newValue) || 0;
      setLastRead((cur) => (n > cur ? n : cur));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [meId]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => () => clearTimeout(hlTimer.current), []);

  // Saat di-pin: tandai <html> agar kerangka halaman memberi ruang di kanan.
  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('gc-docked', docked);
    return () => el.classList.remove('gc-docked');
  }, [docked]);

  // Pengaturan baru saja disimpan (tombol gembok / halaman /admin/chat) → perbarui status grup segera.
  useEffect(() => {
    const on = (e) => {
      const s = e.detail;
      if (!s || typeof s !== 'object') return;
      lockDoneRef.current = Date.now(); // sync yang dimulai sebelum ini membawa status lama
      setConfig((c) => {
        if (!c) return c;
        const next = { ...c, group: { enabled: s.enabled !== false, peserta_can_send: s.peserta_can_send !== false } };
        if (typeof s.auto_delete === 'boolean') next.auto_delete = s.auto_delete;
        if (Number(s.retention_days) > 0) next.retention_days = Number(s.retention_days);
        return sameJSON(c, next) ? c : next;
      });
    };
    window.addEventListener(SETTINGS_EVENT, on);
    return () => window.removeEventListener(SETTINGS_EVENT, on);
  }, []);

  // ---------- Config & error ----------
  const disableChat = useCallback(() => setConfig((c) => ({ ...(c || normalizeConfig({})), enabled: false, can_send: false })), []);

  /**
   * Ganti config dengan versi server. `at` = waktu request dimulai: bila request dimulai sebelum
   * PUT gembok terakhir selesai (atau saat PUT masih berjalan), `group` lamanya diabaikan agar tombol tidak berkedip.
   */
  const putConfig = useCallback((c, at) => {
    if (!c) return;
    const stale = lockPendRef.current || at < lockDoneRef.current;
    setConfig((p) => {
      const next = stale && p?.group ? { ...c, group: p.group } : c;
      return sameJSON(p, next) ? p : next;
    });
  }, []);

  const refreshConfig = useCallback(async () => {
    const at = Date.now();
    try {
      putConfig(normalizeConfig(await api.get('/chat/config')), at);
    } catch {
      /* config ikut diperbarui saat sync berikutnya */
    }
  }, [putConfig]);

  /** `config` & `pinned` dari respons messages/sync menggantikan state (server = sumber kebenaran). */
  const applyMeta = useCallback(
    (r, at) => {
      putConfig(normalizeConfig(r.config), at);
      if (Array.isArray(r.pinned)) setPins((p) => (sameJSON(p, r.pinned) ? p : r.pinned));
    },
    [putConfig],
  );

  /** Toast error + tangani kode khusus GroupChat (403 CHAT_DISABLED / CHAT_CLOSED / CHAT_FEATURE_DISABLED). */
  const fail = useCallback(
    (err, title) => {
      const code = err?.code;
      if (code === 'CHAT_DISABLED') disableChat();
      else if (code === 'CHAT_CLOSED') setConfig((c) => ({ ...(c || normalizeConfig({})), can_send: false }));
      else if (code === 'CHAT_FEATURE_DISABLED') refreshConfig();
      const field = err?.fields && Object.values(err.fields).find((v) => typeof v === 'string' && v);
      toast.error(title, field || errorMessage(err));
    },
    [toast, disableChat, refreshConfig],
  );

  // ---------- Muat awal & sinkron ----------
  const loadInitial = useCallback(async () => {
    setLoadErr(null);
    const at = Date.now();
    try {
      const r = await api.get('/chat/messages', { query: { limit: 50 } });
      setMsgs(r.items || []);
      setHasMore(!!r.has_more);
      if (r.config) applyMeta(r, at);
      else setConfig((p) => p || normalizeConfig({ retention_days: r.retention_days || 7 }));
      setPins(Array.isArray(r.pinned) ? r.pinned : []);
      sinceRef.current = r.server_time;
      resetRef.current = r.reset_at || null;
      stickBottom.current = true;
    } catch (err) {
      if (err?.code === 'CHAT_DISABLED') disableChat();
      else setLoadErr(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applyMeta, disableChat]);

  useEffect(() => {
    if (meId) loadInitial();
  }, [meId, loadInitial]);

  useEffect(() => {
    if (!meId || hidden) return undefined;
    let alive = true;
    const tick = async () => {
      // Satu sync dalam satu waktu (interval lama/baru saat `visible` berubah tidak saling tumpang tindih).
      // Tetap berjalan saat panel tertutup / tab tersembunyi (≤12 dtk) agar lencana & judul tab ikut terbarui.
      if (syncBusy.current || !sinceRef.current) return;
      syncBusy.current = true;
      try {
        // has_more → server memotong hasil; server_time = updated_at baris terakhir, langsung lanjutkan
        // (maks 20 putaran per tick). Item bisa berulang (overlap server) — merge per id tetap aman.
        for (let n = 0; n < 20; n += 1) {
          const at = Date.now();
          const since = sinceRef.current;
          const r = await api.get('/chat/sync', { query: { since } });
          if (!alive) return;
          if (r.reset_at && r.reset_at !== resetRef.current) {
            // Admin mereset GroupChat → muat ulang dari awal.
            await loadInitial();
            return;
          }
          if (r.server_time) sinceRef.current = r.server_time;
          applyMeta(r, at);
          const items = r.items || [];
          const purge = r.purge_before ? ts(r.purge_before) : 0; // null bila hapus otomatis nonaktif
          setMsgs((list) => {
            let next = merge(list, items, hasMoreRef.current && list.length ? ts(list[0].created_at) : -Infinity);
            if (purge) {
              const kept = next.filter((m) => m.starred || m.pinned || ts(m.created_at) >= purge);
              if (kept.length !== next.length) next = kept;
            }
            return next;
          });
          // Tanpa kemajuan `since` → tunggu interval berikutnya agar tidak berputar terus.
          if (!r.has_more || !r.server_time || r.server_time === since) break;
        }
      } catch (err) {
        if (alive && err?.code === 'CHAT_DISABLED') disableChat();
        /* selain itu abaikan; coba lagi di tick berikutnya */
      } finally {
        syncBusy.current = false;
      }
    };
    const t = setInterval(tick, visible && !pageHidden ? 2500 : 12000);
    if (!pageHidden) tick(); // kembali ke tab → langsung sinkron
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [meId, hidden, visible, pageHidden, loadInitial, applyMeta, disableChat]);

  // Nonaktif untuk peserta: cek ulang /chat/config tiap 30 dtk agar muncul lagi saat diaktifkan.
  useEffect(() => {
    if (!meId || !hidden) return undefined;
    let alive = true;
    const t = setInterval(async () => {
      if (document.hidden) return;
      try {
        const c = normalizeConfig(await api.get('/chat/config'));
        if (!alive || !c || !c.enabled) return;
        setConfig(c);
        setLoading(true);
        loadInitial();
      } catch {
        /* coba lagi pada interval berikutnya */
      }
    }, CONFIG_POLL);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [meId, hidden, loadInitial]);

  // Disembunyikan → tutup panel & bersihkan state sementara.
  useEffect(() => {
    if (!hidden) return;
    setOpen(false);
    setReplyTo(null);
    setReactBar(null);
    setReactPick(null);
    setActiveId(null);
  }, [hidden]);

  // Tidak bisa mengirim / balasan dimatikan → batalkan balasan yang tertunda.
  useEffect(() => {
    if (!perms.reply) setReplyTo(null);
  }, [perms.reply]);

  // Pesan yang sedang dibalas terhapus → batalkan balasan.
  useEffect(() => {
    if (replyTo && msgs.some((m) => m.id === replyTo.id && m.deleted)) setReplyTo(null);
  }, [msgs, replyTo]);

  useEffect(() => {
    if (pinIdx >= pins.length && pinIdx !== 0) setPinIdx(0);
  }, [pins.length, pinIdx]);

  // ---------- Gulir ----------
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stickBottom.current = bottom;
    setAtBottom((b) => (b === bottom ? b : bottom));
  };
  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    stickBottom.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };
  useLayoutEffect(() => {
    const el = listRef.current;
    const opened = visible && !wasVisible.current;
    wasVisible.current = visible;
    if (!el || !visible) return;
    if (opened) {
      // Panel baru terlihat → selalu mulai dari pesan terbaru (lompatan kutipan/sematan sebelumnya tidak berlaku).
      stickBottom.current = true;
      prependRef.current = null;
      setAtBottom(true);
    }
    if (prependRef.current != null) {
      el.scrollTop = el.scrollHeight - prependRef.current; // pertahankan posisi saat memuat pesan lama
      prependRef.current = null;
    } else if (stickBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [msgs, visible]);

  /** Gulir ke pesan (bila sudah dimuat) lalu sorot sebentar. */
  const jumpTo = useCallback(
    (id) => {
      const list = listRef.current;
      const el = list?.querySelector(`[data-mid="${id}"]`);
      if (!el) {
        toast.info('Pesan belum dimuat', hasMoreRef.current ? 'Pesan berada di riwayat lama. Muat pesan sebelumnya lalu coba lagi.' : 'Pesan aslinya sudah tidak tersedia.');
        return;
      }
      stickBottom.current = false;
      const lr = list.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      list.scrollTo({ top: list.scrollTop + er.top - lr.top - list.clientHeight / 2 + er.height / 2, behavior: 'smooth' });
      setHighlightId(id);
      clearTimeout(hlTimer.current);
      hlTimer.current = setTimeout(() => setHighlightId(null), 1800);
    },
    [toast],
  );

  // ---------- Belum dibaca ----------
  // Dianggap dibaca hanya bila panel terlihat, tab browser aktif, dan daftar digulir sampai bawah.
  const newest = msgs.length ? ts(msgs[msgs.length - 1].created_at) : 0;
  const seeing = visible && !pageHidden && atBottom && !loading;
  useEffect(() => {
    if (seeing && readFor === meId && meId && newest > lastRead) {
      setLastRead(newest);
      store.set(readKey(meId), String(newest));
    }
  }, [seeing, readFor, meId, newest, lastRead]);
  const { unread, unreadMention } = useMemo(() => {
    let n = 0;
    let at = false;
    msgs.forEach((m) => {
      if (m.deleted || m.user.id === meId || ts(m.created_at) <= lastRead) return;
      n += 1;
      if (!at && (m.mentions || []).some((x) => x.id === meId)) at = true;
    });
    return { unread: n, unreadMention: at };
  }, [msgs, lastRead, meId]);
  const unreadShown = readFor === meId ? unread : 0;
  useTitleCount(user && !hidden && ready ? unreadShown : 0);

  const loadOlder = async () => {
    if (!msgs.length || loadingOlder) return;
    setLoadingOlder(true);
    prependRef.current = null;
    const at = Date.now();
    try {
      const r = await api.get('/chat/messages', { query: { limit: 50, before: msgs[0].created_at } });
      const items = r.items || [];
      const h = listRef.current ? listRef.current.scrollHeight : null;
      setMsgs((list) => {
        const next = merge(list, items);
        // Posisi gulir dipertahankan hanya bila daftar benar-benar bertambah (pasti ada render → efek gulir memakainya).
        prependRef.current = h != null && next.length > list.length ? h : null;
        return next;
      });
      setHasMore(!!r.has_more);
      applyMeta(r, at);
    } catch (err) {
      prependRef.current = null;
      fail(err, 'Gagal memuat pesan');
    } finally {
      setLoadingOlder(false);
    }
  };

  // ---------- Kirim ----------
  const send = useCallback(
    async ({ body, file, replyTo: rid, mentions }) => {
      const fd = new FormData();
      fd.append('body', body);
      if (file) fd.append('file', file);
      if (rid) fd.append('reply_to', rid);
      if (mentions.length) fd.append('mentions', mentions.join(','));
      // Hanya batalkan balasan yang ikut terkirim; balasan baru yang dipilih selama mengirim dipertahankan.
      const dropReply = () => setReplyTo((cur) => (cur && cur.id === rid ? null : cur));
      try {
        const m = await api.upload('/chat/messages', fd);
        stickBottom.current = true;
        setMsgs((list) => merge(list, [m]));
        dropReply();
        return true;
      } catch (err) {
        if (err?.fields?.reply_to) dropReply();
        fail(err, 'Pesan gagal dikirim');
        return false;
      }
    },
    [fail],
  );

  const onComposerError = useCallback(
    (err) => {
      if (err?.code === 'CHAT_DISABLED') disableChat();
      else if (err?.code === 'CHAT_FEATURE_DISABLED') refreshConfig(); // mis. @tag dimatikan admin → /chat/members 403
    },
    [disableChat, refreshConfig],
  );

  // ---------- Aksi pesan ----------
  /**
   * Batalkan perubahan optimistis yang gagal pada salinan TERKINI pesan (bukan snapshot lama),
   * sehingga pembaruan sync/aksi lain yang tiba di antaranya tetap ada. 404 → pesan sudah dihapus.
   */
  const rollback = (id, err, undo) => {
    if (err?.status === 404) {
      setMsgs((list) => markDeleted(list, id));
      setPins((p) => p.filter((x) => x.id !== id));
      return;
    }
    setMsgs((list) => list.map((x) => (x.id === id && !x.deleted ? undo(x) : x)));
  };

  const toggleStar = async (m) => {
    const want = !m.starred;
    setMsgs((list) => list.map((x) => (x.id === m.id && !x.deleted ? { ...x, starred: want, starred_by_name: want ? user.name : null } : x)));
    try {
      const r = await api.patch(`/chat/messages/${m.id}/star`, { starred: want });
      setMsgs((list) => merge(list, [r]));
    } catch (err) {
      // Kembalikan hanya bila nilainya masih hasil perubahan saya.
      rollback(m.id, err, (x) => (x.starred === want ? { ...x, starred: m.starred, starred_by_name: m.starred_by_name ?? null } : x));
      fail(err, 'Gagal memberi bintang');
    }
  };

  /** Pindahkan fokus ke tombol "Aksi pesan" (setelah bereaksi / menutup bilah / Escape) — hanya bila memakai keyboard. */
  const focusMsg = useCallback((id, force = false) => {
    if (!force && !kbRef.current) return;
    requestAnimationFrame(() => listRef.current?.querySelector(`[data-mid="${id}"] [data-msg-actions]`)?.focus({ preventScroll: true }));
  }, []);

  /** Reaksi: satu per pengguna; emoji sama = hapus (server men-toggle). Optimistis + rollback. */
  const react = async (m, emoji) => {
    setReactBar(null);
    setReactPick(null);
    setActiveId(null);
    focusMsg(m.id);
    const me = { id: meId, name: user.name };
    const before = (m.reactions || []).find((r) => (r.users || []).some((u) => u.id === meId))?.emoji || null;
    setMsgs((list) => list.map((x) => (x.id === m.id && !x.deleted ? applyReaction(x, me, emoji) : x)));
    try {
      const r = await api.put(`/chat/messages/${m.id}/reaction`, { emoji });
      if (r && r.id) setMsgs((list) => merge(list, [r]));
    } catch (err) {
      rollback(m.id, err, (x) => setMyReaction(x, me, before));
      fail(err, 'Gagal memberi reaksi');
    }
  };

  /** Admin: sematkan / lepas sematan → { message, pinned }. */
  const togglePinMsg = async (m, pinned = !m.pinned) => {
    if (pinBusy) return;
    setPinBusy(true);
    try {
      const r = await api.patch(`/admin/chat/messages/${m.id}/pin`, { pinned });
      const list = Array.isArray(r?.pinned) ? r.pinned : null;
      setMsgs((prev) => {
        const minTs = hasMoreRef.current && prev.length ? ts(prev[0].created_at) : -Infinity;
        let next = merge(prev, [r?.message, ...(list || [])].filter(Boolean), minTs);
        if (list) {
          // Sematan terlama yang dilepas otomatis (maks 3) → perbarui salinan lokalnya.
          const ids = new Set(list.map((x) => x.id));
          next = next.map((x) => (x.pinned && !ids.has(x.id) && x.id !== r?.message?.id ? { ...x, pinned: false, pinned_at: null, pinned_by_name: null } : x));
        }
        return next;
      });
      if (list) setPins(list);
      if (pinned) setPinIdx(0);
      toast.success(pinned ? 'Pesan disematkan' : 'Sematan dilepas');
    } catch (err) {
      fail(err, pinned ? 'Gagal menyematkan pesan' : 'Gagal melepas sematan');
    } finally {
      setPinBusy(false);
    }
  };

  const remove = async () => {
    const m = toDelete;
    try {
      await api.del(`/chat/messages/${m.id}`);
      setMsgs((list) => markDeleted(list, m.id));
      setPins((p) => p.filter((x) => x.id !== m.id)); // pesan tersemat yang dihapus ikut hilang dari banner
      return true;
    } catch (err) {
      fail(err, 'Gagal menghapus pesan');
      return false;
    }
  };
  const reset = async () => {
    try {
      await api.post('/admin/chat/reset');
      setReplyTo(null);
      await loadInitial();
      toast.success('GroupChat direset', 'Semua riwayat pesan dan file telah dihapus.');
      return true;
    } catch (err) {
      toast.error('Gagal mereset', errorMessage(err));
      return false;
    }
  };
  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(m.body);
      toast.success('Teks disalin');
    } catch {
      toast.error('Gagal menyalin');
    }
  };
  const startReply = (m) => {
    setReplyTo(m);
    setActiveId(null);
    setReactBar(null);
    requestAnimationFrame(() => taRef.current?.focus());
  };

  /**
   * Admin: tutup/buka grup sesuai yang TERLIHAT di tombol (tertutup → buka, terbuka → tutup).
   * Hanya `peserta_can_send` yang dikirim; server menggabungkannya ke pengaturan tersimpan,
   * jadi perubahan lain (mis. dari halaman /admin/chat) tidak tertimpa salinan lama.
   */
  const toggleLock = async () => {
    if (lockBusy) return;
    const openGroup = groupClosed;
    setLockBusy(true);
    lockPendRef.current = true;
    try {
      const saved = await api.put('/admin/chat/settings', { peserta_can_send: openGroup });
      const ss = saved?.settings || { enabled: config?.group?.enabled !== false, peserta_can_send: openGroup };
      setConfig((c) => ({ ...(c || normalizeConfig({})), group: { enabled: ss.enabled !== false, peserta_can_send: ss.peserta_can_send !== false } }));
      // Beri tahu halaman /admin/chat (bila terbuka) agar tidak menyimpan nilai gembok yang lama.
      if (saved?.settings) window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: saved.settings }));
      if (ss.peserta_can_send !== false) toast.success('Grup dibuka', 'Semua peserta dapat mengirim pesan kembali.');
      else toast.success('Grup ditutup', 'Hanya admin yang dapat mengirim pesan.');
    } catch (err) {
      fail(err, 'Gagal mengubah status grup');
    } finally {
      lockPendRef.current = false;
      lockDoneRef.current = Date.now();
      setLockBusy(false);
    }
  };

  // Pemanggil stabil untuk <Bubble> (memo): handler terbaru disimpan di ref.
  useLayoutEffect(() => {
    handlers.current = {
      activate: (m) => {
        setActiveId(m.id);
        setReactBar((id) => (id === m.id ? id : null));
      },
      toggleActions: (m) => {
        setActiveId((id) => (id === m.id ? null : m.id));
        setReactBar(null);
      },
      jump: (_m, id) => jumpTo(id),
      reactBar: (m) => setReactBar((id) => (id === m.id ? null : m.id)),
      react: (m, e) => react(m, e),
      reactMore: (m) => {
        setReactBar(null);
        setReactPick(m.id);
      },
      reply: startReply,
      star: toggleStar,
      copy,
      pin: (m) => togglePinMsg(m),
      delete: (m) => setToDelete(m),
    };
  });
  const onAction = useCallback((type, m, arg) => handlers.current?.[type]?.(m, arg), []);

  const openPin = (p, i) => {
    jumpTo(p.id);
    if (pins.length > 1) setPinIdx((i + 1) % pins.length);
  };

  const togglePanelPin = () => {
    const next = !dockPin;
    setDockPin(next);
    store.set(PIN_KEY, next ? '1' : '0');
    if (!next) setOpen(true); // lepas pin → tetap terbuka sebagai panel melayang
  };
  const close = () => {
    setOpen(false);
    if (dockPin) {
      setDockPin(false);
      store.set(PIN_KEY, '0');
    }
  };

  // Escape: tutup pemilih reaksi → bilah reaksi → toolbar aksi (bila fokus di pesan itu) → panel melayang (bukan saat di-pin).
  // Fokus kembali ke tombol "Aksi pesan" pesan terkait. Pemilih emoji & daftar @tag di komposer menangani Escape lebih dulu.
  useEffect(() => {
    if (!visible) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || toDelete || resetOpen) return;
      const inMsg = activeId && listRef.current?.querySelector(`[data-mid="${activeId}"]`)?.contains(document.activeElement);
      if (reactPick) {
        setReactPick(null);
        focusMsg(reactPick, true);
      } else if (reactBar) {
        setReactBar(null);
        focusMsg(reactBar, true);
      } else if (inMsg) {
        setActiveId(null);
        focusMsg(activeId, true);
      } else if (open && !docked) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, open, docked, reactPick, reactBar, activeId, toDelete, resetOpen, focusMsg]);

  const closePick = () => {
    const id = reactPick;
    setReactPick(null);
    focusMsg(id);
  };

  // Baris tampilan (pemisah hari & pengelompokan) dihitung sekali per perubahan daftar.
  const rows = useMemo(() => {
    const cut = Date.now() - 864e5;
    const shown = msgs.filter((m) => !m.deleted || ts(m.updated_at) > cut);
    const keys = shown.map((m) => dayKey(m.created_at));
    return shown.map((m, i) => {
      const prev = shown[i - 1];
      const newDay = !prev || keys[i - 1] !== keys[i];
      const grouped = !newDay && prev.user.id === m.user.id && !prev.deleted && ts(m.created_at) - ts(prev.created_at) < 5 * 60 * 1000;
      return { m, newDay, label: newDay ? dayLabel(m.created_at) : null, grouped };
    });
  }, [msgs]);

  const pickMsg = reactPick ? msgs.find((m) => m.id === reactPick && !m.deleted) : null;
  const pickMine = pickMsg ? (pickMsg.reactions || []).find((r) => (r.users || []).some((u) => u.id === meId))?.emoji : null;

  if (!user || hidden || !ready) return null;

  return (
    <>
      {/* ---------- Tombol bulat ---------- */}
      {!docked && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          data-tour="groupchat"
          aria-label={open ? 'Tutup GroupChat' : `Buka GroupChat${unreadShown ? `, ${unreadShown} pesan baru` : ''}${unreadShown > 0 && unreadMention ? ', ada yang menandai Anda' : ''}`}
          className={cn(
            'fixed bottom-5 right-4 z-[45] max-sm:right-[max(16px,env(safe-area-inset-right))] flex h-14 w-14 max-sm:h-12 max-sm:w-12 max-sm:bottom-[max(16px,calc(env(safe-area-inset-bottom)+8px))] items-center justify-center rounded-full bg-obsidian text-white shadow-float transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/40 sm:bottom-6 sm:right-6',
            open && 'max-lg:hidden',
            'max-sm:transition-[transform,opacity] max-sm:duration-300',
            fabHidden && !open && 'max-sm:pointer-events-none max-sm:translate-y-24 max-sm:opacity-0',
          )}
        >
          {open ? <X className="h-6 w-6" /> : <MessagesSquare className="h-6 w-6" />}
          {!open && unreadShown > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 animate-scale-in items-center justify-center rounded-full bg-danger px-1.5 text-xs font-bold tabular-nums text-white ring-2 ring-white" aria-hidden>
              {unreadShown > 99 ? '99+' : unreadShown}
            </span>
          )}
          {!open && unreadShown > 0 && unreadMention && (
            <span aria-hidden className="absolute -left-0.5 -top-0.5 flex h-6 w-6 animate-scale-in items-center justify-center rounded-full bg-mint text-xs font-bold text-obsidian ring-2 ring-white">
              @
            </span>
          )}
        </button>
      )}

      {/* ---------- Panel ---------- */}
      {visible && (
        <section
          aria-label="GroupChat"
          onKeyDownCapture={() => {
            kbRef.current = true;
          }}
          onPointerDownCapture={() => {
            kbRef.current = false;
          }}
          style={isDesktop ? { width: panelW } : undefined}
          className={cn(
            'fixed z-[46] flex flex-col overflow-hidden bg-white',
            docked
              ? 'inset-y-0 right-0 border-l border-mist-100'
              : 'inset-0 animate-fade-in lg:inset-auto lg:bottom-24 lg:right-6 lg:h-[min(660px,calc(100vh-130px))] lg:animate-scale-in lg:rounded-[24px] lg:shadow-float lg:ring-1 lg:ring-mist-100',
            resizing && 'select-none',
          )}
        >
          {/* Pegangan ubah lebar (sisi kiri, desktop) */}
          {isDesktop && (
            <div
              {...resizeHandle}
              className={cn(
                'group/rs absolute inset-y-0 left-0 z-20 flex w-2.5 cursor-ew-resize items-center justify-center focus-visible:outline-none',
                docked ? '' : 'rounded-l-[24px]',
              )}
            >
              <span
                className={cn(
                  'h-14 w-1 rounded-full transition-all duration-150',
                  resizing ? 'h-24 bg-cobalt' : 'bg-mist/0 group-hover/rs:bg-mist group-focus-visible/rs:bg-cobalt',
                )}
                aria-hidden
              />
            </div>
          )}
          {/* Header */}
          <header className="flex items-center gap-3 border-b border-mist-100 px-4 py-3 max-sm:pt-[max(12px,env(safe-area-inset-top))]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-obsidian text-white">
              <MessagesSquare className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold leading-tight">GroupChat</h2>
              <p className="truncate text-xs text-mist-700">Semua peserta & admin <BrandName /></p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={toggleLock}
                disabled={lockBusy}
                title={groupClosed ? 'Buka grup — semua peserta bisa mengirim' : 'Tutup grup — hanya admin yang dapat mengirim'}
                aria-label={groupClosed ? 'Buka grup untuk semua peserta' : 'Tutup grup, hanya admin yang dapat mengirim'}
                aria-pressed={groupClosed}
                className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-60', groupClosed ? 'bg-warning-50 text-warning-700 hover:bg-warning-50/70' : 'text-obsidian-600 hover:bg-ghost')}
              >
                {lockBusy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : groupClosed ? <Lock className="h-[18px] w-[18px]" /> : <LockOpen className="h-[18px] w-[18px]" />}
              </button>
            )}
            {isAdmin && (
              <button type="button" onClick={() => setResetOpen(true)} title="Reset GroupChat" aria-label="Reset GroupChat" className="flex h-9 w-9 items-center justify-center rounded-xl text-danger-700 transition-colors hover:bg-danger-50">
                <RotateCcw className="h-[18px] w-[18px]" />
              </button>
            )}
            <button
              type="button"
              onClick={togglePanelPin}
              title={dockPin ? 'Lepas pin' : 'Pin di sisi kanan'}
              aria-label={dockPin ? 'Lepas pin GroupChat' : 'Pin GroupChat di sisi kanan'}
              aria-pressed={dockPin}
              className={cn('hidden h-9 w-9 items-center justify-center rounded-xl transition-colors lg:flex', dockPin ? 'bg-cobalt-50 text-cobalt' : 'text-obsidian-600 hover:bg-ghost')}
            >
              {dockPin ? <PinOff className="h-[18px] w-[18px]" /> : <Pin className="h-[18px] w-[18px]" />}
            </button>
            <button type="button" onClick={close} aria-label="Tutup GroupChat" className="flex h-9 w-9 items-center justify-center rounded-xl text-obsidian-600 transition-colors hover:bg-ghost">
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Info status grup (khusus admin) */}
          {isAdmin && config?.group?.enabled === false && (
            <p role="status" className="flex items-center gap-1.5 border-b border-mist-100 bg-danger-50 px-4 py-2 text-[11px] font-medium text-danger-700">
              <EyeOff className="h-3 w-3 shrink-0" aria-hidden />
              GroupChat nonaktif untuk peserta
            </p>
          )}
          {isAdmin && groupClosed && (
            <p role="status" className="flex items-center gap-1.5 border-b border-mist-100 bg-warning-50 px-4 py-2 text-[11px] font-medium text-warning-700">
              <Lock className="h-3 w-3 shrink-0" aria-hidden />
              Grup ditutup — hanya admin yang dapat mengirim
            </p>
          )}
          {isAdmin && (
            <p className="flex items-center gap-1.5 border-b border-mist-100 bg-ghost/60 px-4 py-2 text-[11px] text-mist-700">
              <Star className="h-3 w-3 shrink-0 fill-warning text-warning" />
              {config?.auto_delete === false ? 'Hapus otomatis nonaktif — pesan disimpan sampai dihapus.' : `Pesan terhapus otomatis setelah ${retention} hari, kecuali yang berbintang.`}
            </p>
          )}

          <PinnedBanner pins={pins} index={pinIdx} isAdmin={isAdmin} busy={pinBusy} onOpen={openPin} onUnpin={(p) => togglePinMsg(p, false)} />

          {/* Daftar pesan */}
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={listRef}
              data-gc-list
              onScroll={onScroll}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-ghost/40 px-3 py-3"
              onClick={() => {
                setActiveId(null);
                setReactBar(null);
              }}
            >
              {loading ? (
                <div className="flex h-full items-center justify-center text-mist-700">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : loadErr ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-mist-700">
                  {loadErr}
                  <button type="button" onClick={loadInitial} className="rounded-full bg-white px-4 py-2 font-medium text-obsidian ring-1 ring-mist-100">
                    Coba lagi
                  </button>
                </div>
              ) : !rows.length ? (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-mist-700 ring-1 ring-mist-100">
                    <MessagesSquare className="h-6 w-6" />
                  </span>
                  <p className="mt-4 text-[15px] font-semibold">Belum ada obrolan</p>
                  <p className="mt-1 max-w-[240px] text-sm text-mist-700">Sapa peserta lain, bagikan tips belajar, atau tanyakan soal yang sulit.</p>
                </div>
              ) : (
                <>
                  {hasMore && (
                    <div className="mb-3 flex justify-center">
                      <button type="button" onClick={loadOlder} disabled={loadingOlder} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-mist-100 hover:bg-mist-50">
                        {loadingOlder && <Loader2 className="h-3 w-3 animate-spin" />}
                        Muat pesan sebelumnya
                      </button>
                    </div>
                  )}
                  {rows.map(({ m, newDay, label, grouped }) => {
                    const mine = m.user.id === meId;
                    return (
                      <Fragment key={m.id}>
                        {newDay && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-mist-700 ring-1 ring-mist-100">{label}</span>
                          </div>
                        )}
                        <Bubble
                          m={m}
                          meId={meId}
                          mine={mine}
                          grouped={grouped}
                          active={activeId === m.id}
                          highlighted={highlightId === m.id}
                          reacting={reactBar === m.id}
                          perms={perms}
                          canDelete={isAdmin || (mine && perms.deleteOwn)}
                          onAction={onAction}
                        />
                      </Fragment>
                    );
                  })}
                </>
              )}
            </div>
            {!loading && !atBottom && unreadShown > 0 && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
                <button
                  type="button"
                  onClick={scrollToBottom}
                  aria-label={`${unreadShown} pesan baru, gulir ke pesan terbaru`}
                  className="pointer-events-auto inline-flex h-9 animate-scale-in items-center gap-1.5 rounded-full bg-cobalt px-4 text-[13px] font-semibold text-white shadow-float transition-colors hover:bg-cobalt-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30"
                >
                  <span className="tabular-nums">{unreadShown > 99 ? '99+' : unreadShown}</span> pesan baru
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </div>

          {/* Komposer / bar gembok (peserta saat grup ditutup) */}
          {perms.canSend ? (
            <ChatComposer inputRef={taRef} visible={visible} perms={perms} meId={meId} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onSend={send} onApiError={onComposerError} />
          ) : (
            <div role="status" className="flex items-center justify-center gap-2 border-t border-mist-100 bg-white px-4 py-4 text-center text-[13px] text-mist-700">
              <Lock className="h-4 w-4 shrink-0 text-obsidian-600" aria-hidden />
              Grup sedang ditutup. Hanya admin yang dapat mengirim pesan.
            </div>
          )}

          {/* Pemilih reaksi lengkap ("+") */}
          {pickMsg && (
            <>
              <div aria-hidden className="absolute inset-0 z-20 animate-fade-in bg-obsidian/10" onClick={closePick} />
              <EmojiPicker
                className="absolute inset-x-3 bottom-3 z-30"
                label="Pilih reaksi"
                autoFocus
                selected={pickMine}
                onPick={(e) => react(pickMsg, e)}
                header={
                  <div className="flex items-center gap-2 border-b border-mist-100 py-1.5 pl-3 pr-1.5">
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold">Reaksi untuk pesan {pickMsg.user.id === meId ? 'Anda' : pickMsg.user.name}</p>
                    <button type="button" onClick={closePick} aria-label="Tutup pemilih reaksi" className="flex h-8 w-8 items-center justify-center rounded-full text-mist-700 hover:bg-ghost">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                }
              />
            </>
          )}
        </section>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        tone="danger"
        title="Hapus pesan ini?"
        description="Pesan dan lampirannya akan dihapus untuk semua anggota GroupChat."
        confirmText="Ya, hapus"
        icon={<Trash2 className="h-[22px] w-[22px]" />}
      />
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={reset}
        tone="danger"
        title="Reset GroupChat?"
        description="SEMUA riwayat pesan dan file akan dihapus permanen, termasuk pesan berbintang. Tindakan ini tidak bisa dibatalkan."
        confirmText="Ya, reset semua"
        icon={<RotateCcw className="h-[22px] w-[22px]" />}
      />
    </>
  );
}

export default GroupChat;
