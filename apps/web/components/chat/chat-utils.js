/** Utilitas GroupChat (tanpa React): format waktu, gabung pesan, konfigurasi, @tag, lampiran. */

export const MAX_FILE = 10 * 1024 * 1024;
export const MAX_BODY = 2000;
export const MAX_MENTIONS = 10;
/** Event window: detail = objek pengaturan GroupChat terbaru dari server (panel chat ⇄ halaman /admin/chat). */
export const SETTINGS_EVENT = 'bisapns:chat-settings';
export const URL_RE = /(https?:\/\/[^\s<>"']+)/g;
/**
 * Sama dengan hasURL di server: http:// atau https:// di mana saja; "www." hanya di awal teks
 * atau setelah karakter bukan huruf/angka (agar "awww." tidak dianggap link).
 */
export const HAS_URL_RE = /https?:\/\/|(?:^|[^\p{L}\p{Nd}])www\./iu;
/** Hanya emoji (maks 24 unit). Wajib ada minimal satu piktograf / keycap / bendera agar "5", "2024", "#1" tidak ikut. */
export const EMOJI_ONLY_RE = /^(?=[\s\S]*(?:\p{Extended_Pictographic}|⃣|\p{Regional_Indicator}))(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s){1,24}$/u;
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

/** Ekstensi per jenis lampiran (sama dengan daftar server). */
export const ATTACH_EXT = {
  image: ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
  video: ['.mp4', '.webm', '.mov'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.opus'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.zip', '.rar'],
};
export const ATTACH_LABEL = { image: 'gambar', video: 'video', audio: 'audio', document: 'dokumen' };
/** Label jenis pesan untuk kutipan / banner sematan. */
export const KIND_LABEL = { image: 'Foto', video: 'Video', audio: 'Audio', file: 'Dokumen' };

const FEATURES = { attachments: { image: true, video: true, audio: true, document: true }, links: true, emoji: true, reactions: true, replies: true, mentions: true, stars: true, user_delete: true };
export const DEFAULT_CONFIG = { enabled: true, can_send: true, retention_days: 7, auto_delete: true, features: FEATURES };

/** Lengkapi config dari server dengan default (nilai yang tidak ada = aktif). */
export function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const f = raw.features || {};
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    features: { ...FEATURES, ...f, attachments: { ...FEATURES.attachments, ...(f.attachments || {}) } },
  };
}

/** Bandingkan dangkal via JSON (objek kecil) agar state tidak berganti tanpa perlu. */
export const sameJSON = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

export const store = {
  get(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  remove(k) {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

// Formatter dibuat sekali (lazy) — dipakai untuk setiap gelembung.
const fmt = {};
const getFmt = (k, locale, opts) => fmt[k] || (fmt[k] = new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Jakarta', ...opts }));

export const ts = (v) => new Date(v).getTime();
export const jam = (v) => getFmt('jam', 'id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(v));
export const dayKey = (v) => getFmt('day', 'en-CA', {}).format(new Date(v));
export function dayLabel(v) {
  const k = dayKey(v);
  if (k === dayKey(new Date())) return 'Hari ini';
  if (k === dayKey(Date.now() - 864e5)) return 'Kemarin';
  return getFmt('long', 'id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(v));
}

/**
 * Gabungkan daftar pesan (versi server menggantikan salinan lokal per id), urut lama → baru.
 * Pesan baru yang lebih lama dari `minTs` (di luar jendela yang sudah dimuat) tidak ditambahkan
 * agar linimasa tidak bolong. Pesan yang kini terhapus → kutipan `reply_to` yang merujuknya ikut ditandai terhapus.
 */
export function merge(list, incoming, minTs = -Infinity) {
  if (!incoming || !incoming.length) return list;
  const map = new Map(list.map((m) => [m.id, m]));
  const gone = new Set();
  incoming.forEach((m) => {
    if (m.deleted) gone.add(m.id);
    if (map.has(m.id) || ts(m.created_at) >= minTs) map.set(m.id, m);
  });
  let out = [...map.values()];
  if (gone.size) out = out.map((m) => (m.reply_to && gone.has(m.reply_to.id) && !m.reply_to.deleted ? { ...m, reply_to: { ...m.reply_to, deleted: true, body: '' } } : m));
  return out.sort((a, b) => ts(a.created_at) - ts(b.created_at));
}

/** Tandai satu pesan terhapus secara lokal (+ kutipan yang merujuknya). */
export function markDeleted(list, id) {
  return list.map((x) => {
    if (x.id === id) return { ...x, deleted: true, body: '', file: null, starred: false, pinned: false, pinned_at: null, pinned_by_name: null, reactions: [], mentions: [] };
    if (x.reply_to && x.reply_to.id === id) return { ...x, reply_to: { ...x.reply_to, deleted: true, body: '' } };
    return x;
  });
}

/** Cuplikan satu baris untuk kutipan / sematan. src: ChatMessage atau objek reply_to. */
export function snippet(src) {
  if (!src) return '';
  if (src.deleted) return 'Pesan telah dihapus';
  const body = (src.body || '').replace(/\s+/g, ' ').trim();
  return body || KIND_LABEL[src.kind] || '';
}

/** Ekstensi yang boleh dilampirkan. att null → semua (admin). */
export function acceptList(att) {
  return Object.keys(ATTACH_EXT).flatMap((k) => (!att || att[k] !== false ? ATTACH_EXT[k] : []));
}
export function extKind(ext) {
  return Object.keys(ATTACH_EXT).find((k) => ATTACH_EXT[k].includes(ext)) || null;
}

export const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Pecah isi pesan menjadi potongan teks / tautan / @tag.
 * Hanya `@Nama` yang tercatat di `mentions` yang disorot.
 */
export function tokenize(text, mentions) {
  const names = [...new Set((mentions || []).map((x) => x.name).filter(Boolean))].sort((a, b) => b.length - a.length);
  const re = names.length ? new RegExp(`@(${names.map(escapeRe).join('|')})(?![\\p{L}\\p{N}_])`, 'gu') : null;
  const out = [];
  text.split(URL_RE).forEach((p, i) => {
    if (!p) return;
    if (i % 2 === 1) {
      out.push({ t: 'url', v: p });
      return;
    }
    if (!re) {
      out.push({ t: 'text', v: p });
      return;
    }
    let last = 0;
    let mm;
    re.lastIndex = 0;
    while ((mm = re.exec(p))) {
      if (mm.index > last) out.push({ t: 'text', v: p.slice(last, mm.index) });
      const who = mentions.find((x) => x.name === mm[1]);
      out.push({ t: 'mention', v: mm[0], id: who ? who.id : null });
      last = mm.index + mm[0].length;
    }
    if (last < p.length) out.push({ t: 'text', v: p.slice(last) });
  });
  return out;
}

/**
 * Deteksi kueri @tag di posisi kursor → { at, q } atau null.
 * Kueri boleh berisi hingga 3 kata (nama lengkap). Nama terpilih yang tepat berakhir di kursor tidak memicu ulang.
 */
export function mentionQuery(text, caret, picked, dismissedAt) {
  if (caret == null) return null;
  const before = text.slice(0, caret);
  const m = /(?:^|\s)@([^\s@]*(?: [^\s@]*){0,2})$/.exec(before);
  if (!m) return null;
  const q = m[1];
  const at = caret - q.length - 1;
  if (at === dismissedAt || q.length > 40 || q.startsWith(' ')) return null;
  // Diam hanya bila tepat satu nama terpilih berakhir di kursor ("@Budi" / "@Budi ") — "@Budi Santoso" tetap dicari.
  if (picked.some((p) => q === p.name || q === `${p.name} `)) return null;
  return { at, q };
}

/**
 * Id tag yang namanya masih ada di teks (unik, maks 10, urut posisi).
 * Nama terpanjang dicocokkan lebih dulu dengan batas kata yang sama seperti tokenize,
 * dan rentang yang sudah dipakai tidak bisa dipakai nama lain ("@Budi Santoso" bukan "@Budi").
 */
export function mentionIds(body, picked) {
  const taken = [];
  const hits = [];
  [...picked]
    .filter((p) => p && p.name)
    .sort((a, b) => b.name.length - a.name.length)
    .forEach((p) => {
      const re = new RegExp(`@${escapeRe(p.name)}(?![\\p{L}\\p{N}_])`, 'gu');
      let mm;
      while ((mm = re.exec(body))) {
        const a = mm.index;
        const b = a + mm[0].length;
        if (!taken.some(([x, y]) => a < y && b > x)) {
          taken.push([a, b]);
          hits.push({ id: p.id, at: a });
          break; // satu kemunculan per orang; sisanya boleh untuk nama sama milik orang lain
        }
      }
    });
  const ids = [];
  hits.sort((x, y) => x.at - y.at).forEach((h) => {
    if (!ids.includes(h.id)) ids.push(h.id);
  });
  return ids.slice(0, MAX_MENTIONS);
}

/** Terapkan reaksi saya secara optimistis (satu reaksi per pengguna; emoji sama = hapus). */
export function applyReaction(m, me, emoji) {
  const list = (m.reactions || []).map((r) => ({ ...r, users: r.users || [] }));
  const prev = list.find((r) => r.users.some((u) => u.id === me.id));
  const next = list
    .map((r) => (r === prev ? { ...r, count: Math.max(0, r.count - 1), users: r.users.filter((u) => u.id !== me.id) } : r))
    .filter((r) => r.count > 0);
  if (!prev || prev.emoji !== emoji) {
    const hit = next.find((r) => r.emoji === emoji);
    if (hit) {
      hit.count += 1;
      hit.users = [...hit.users, { id: me.id, name: me.name }];
    } else {
      next.push({ emoji, count: 1, users: [{ id: me.id, name: me.name }] });
    }
  }
  return { ...m, reactions: next };
}

/** Atur reaksi saya ke `emoji` (null = tanpa reaksi) — dipakai untuk membatalkan perubahan yang gagal. */
export function setMyReaction(m, me, emoji) {
  const list = (m.reactions || [])
    .map((r) => {
      const users = r.users || [];
      if (!users.some((u) => u.id === me.id)) return r;
      return { ...r, count: Math.max(0, r.count - 1), users: users.filter((u) => u.id !== me.id) };
    })
    .filter((r) => r.count > 0);
  return emoji ? applyReaction({ ...m, reactions: list }, me, emoji) : { ...m, reactions: list };
}
