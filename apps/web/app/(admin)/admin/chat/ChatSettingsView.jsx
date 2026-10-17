'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  Hourglass,
  Lock,
  LockOpen,
  MessagesSquare,
  Paperclip,
  Pin,
  RotateCcw,
  ShieldCheck,
  SmilePlus,
  Sparkles,
  Star,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatAngka, formatRingkas } from '@/lib/format';
import { Button, ConfirmDialog, ErrorState, Input, SkeletonCard, Spinner, Switch, useToast } from '@/components/ui';
import { AdminPageHeader, IconBox, Panel, PanelHeader, StatTile, StatusPill } from '@/components/admin/AdminUI';
import { useResource } from '@/components/admin/shared';
import { SETTINGS_EVENT } from '@/components/chat/chat-utils';

/**
 * Halaman admin "GroupChat" (docs/GROUPCHAT-V2.md → Frontend).
 * Switch per fitur disimpan otomatis (optimistis + rollback), retensi hari disimpan saat blur/Enter,
 * reset GroupChat lewat dialog konfirmasi. Semua pembatasan fitur hanya berlaku untuk peserta.
 */

const MIN_DAYS = 1;
const MAX_DAYS = 90;
const POLL_MS = 30000;

/** Nilai bawaan pengaturan (sama dengan default server). */
const DEFAULTS = Object.freeze({
  enabled: true,
  peserta_can_send: true,
  attachments: Object.freeze({ image: true, video: true, audio: true, document: true }),
  links: true,
  emoji: true,
  reactions: true,
  replies: true,
  mentions: true,
  stars: true,
  user_delete: true,
  profanity_filter: true,
  auto_delete: true,
  retention_days: 7,
});

const ATTACH_KEYS = ['image', 'video', 'audio', 'document'];
const BOOL_KEYS = [
  'enabled',
  'peserta_can_send',
  ...ATTACH_KEYS.map((k) => `attachments.${k}`),
  'links',
  'emoji',
  'reactions',
  'replies',
  'mentions',
  'stars',
  'user_delete',
  'profanity_filter',
  'auto_delete',
];

const bool = (v, d) => (typeof v === 'boolean' ? v : d);

/** Rapikan objek pengaturan: hanya kunci yang dikenal, nilai kosong memakai default. */
function normalize(raw) {
  const s = raw || {};
  const a = s.attachments || {};
  const n = Number(s.retention_days);
  return {
    enabled: bool(s.enabled, DEFAULTS.enabled),
    peserta_can_send: bool(s.peserta_can_send, DEFAULTS.peserta_can_send),
    attachments: Object.fromEntries(ATTACH_KEYS.map((k) => [k, bool(a[k], DEFAULTS.attachments[k])])),
    links: bool(s.links, DEFAULTS.links),
    emoji: bool(s.emoji, DEFAULTS.emoji),
    reactions: bool(s.reactions, DEFAULTS.reactions),
    replies: bool(s.replies, DEFAULTS.replies),
    mentions: bool(s.mentions, DEFAULTS.mentions),
    stars: bool(s.stars, DEFAULTS.stars),
    user_delete: bool(s.user_delete, DEFAULTS.user_delete),
    profanity_filter: bool(s.profanity_filter, DEFAULTS.profanity_filter),
    auto_delete: bool(s.auto_delete, DEFAULTS.auto_delete),
    retention_days: Number.isInteger(n) && n >= MIN_DAYS && n <= MAX_DAYS ? n : DEFAULTS.retention_days,
  };
}

const getIn = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

function setIn(obj, path, value) {
  const [k, sub] = path.split('.');
  return sub ? { ...obj, [k]: { ...(obj?.[k] || {}), [sub]: value } } : { ...obj, [k]: value };
}

/** Gabungkan patch parsial (attachments digabung per kunci) ke objek pengaturan. */
function applyPatch(obj, patch) {
  if (!patch) return obj;
  const out = { ...obj, ...patch };
  if (patch.attachments) out.attachments = { ...(obj?.attachments || {}), ...patch.attachments };
  return out;
}

/** Kunci yang berbeda antara dua pengaturan (ternormalisasi) → patch, atau null bila sama. */
function diffPatch(from, to) {
  let p = null;
  [...BOOL_KEYS, 'retention_days'].forEach((k) => {
    if (getIn(from, k) !== getIn(to, k)) p = setIn(p || {}, k, getIn(to, k));
  });
  return p;
}

/** Buang dari patch kunci yang juga ada di `body` (nilai body yang kita simpan lebih baru). */
function omitKeys(patch, body) {
  if (!patch || !body) return patch;
  let out = null;
  [...BOOL_KEYS, 'retention_days'].forEach((k) => {
    const v = getIn(patch, k);
    if (v !== undefined && getIn(body, k) === undefined) out = setIn(out || {}, k, v);
  });
  return out;
}

const allOn = (s) => BOOL_KEYS.every((k) => getIn(s, k) === true);
const sameAs = (a, b) => JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
const num = (v) => (Number(v) >= 10000 ? formatRingkas(v) : formatAngka(v ?? 0));

/* ------------------------------------------------------------------ */
/* Definisi baris switch per bagian                                    */
/* ------------------------------------------------------------------ */

const ATTACH_ROWS = [
  { key: 'attachments.image', label: 'Gambar', description: 'Foto dan gambar (JPG, PNG, WebP, GIF).' },
  { key: 'attachments.video', label: 'Video', description: 'Klip video (MP4, WebM, MOV).' },
  { key: 'attachments.audio', label: 'Audio', description: 'Rekaman suara dan berkas audio (MP3, WAV, OGG, M4A).' },
  { key: 'attachments.document', label: 'Dokumen', description: 'PDF, Word, Excel, PowerPoint, TXT, CSV, dan arsip ZIP/RAR.' },
];

const INTERACTION_ROWS = [
  { key: 'replies', label: 'Balas pesan', description: 'Peserta dapat membalas pesan tertentu dengan kutipan.' },
  { key: 'mentions', label: 'Tag anggota (@)', description: 'Peserta dapat menandai anggota lain dengan @nama.' },
  { key: 'reactions', label: 'Reaksi emoji', description: 'Peserta dapat memberi reaksi emoji pada pesan, seperti di WhatsApp.' },
  { key: 'emoji', label: 'Pemilih emoji', description: 'Tampilkan tombol pemilih emoji di kolom pesan. Emoji yang diketik manual tetap terkirim.' },
  { key: 'stars', label: 'Bintangi pesan', description: 'Peserta dapat membintangi pesan penting. Pesan berbintang tidak terhapus otomatis.' },
  { key: 'links', label: 'Kirim link', description: 'Peserta dapat mengirim pesan berisi tautan (http://, https://, www.).' },
  { key: 'user_delete', label: 'Peserta boleh menghapus pesan sendiri', description: 'Bila nonaktif, hanya admin yang dapat menghapus pesan.' },
];

const STATS = [
  { key: 'messages', title: 'Pesan', info: 'Pesan yang belum terhapus', icon: <MessagesSquare />, caption: 'Pesan aktif di GroupChat' },
  { key: 'members_7d', title: 'Pengirim aktif', info: 'Anggota unik yang mengirim pesan dalam 7 hari terakhir', icon: <Users />, tone: 'mint', caption: 'Pengirim unik 7 hari terakhir' },
  { key: 'starred', title: 'Berbintang', info: 'Pesan berbintang tidak ikut terhapus otomatis', icon: <Star />, tone: 'warning', caption: 'Aman dari hapus otomatis' },
  { key: 'pinned', title: 'Disematkan', info: 'Maksimal 3 pesan tersemat', icon: <Pin />, tone: 'cobalt', suffix: '/3', caption: 'Tampil di banner atas chat' },
  { key: 'files', title: 'Lampiran', info: 'Pesan dengan lampiran gambar, video, audio, atau dokumen', icon: <Paperclip />, caption: 'Gambar, video, audio & dokumen' },
  { key: 'reactions', title: 'Reaksi', info: 'Total reaksi emoji pada pesan aktif', icon: <SmilePlus />, caption: 'Total reaksi emoji' },
];

/* ------------------------------------------------------------------ */
/* Bagian kecil                                                         */
/* ------------------------------------------------------------------ */

/** Kartu satu bagian pengaturan: header + daftar switch bergaris pemisah. */
function Section({ icon, title, subtitle, action, note, children }) {
  return (
    <Panel as="section" padding="lg" aria-label={title}>
      <PanelHeader icon={icon} title={title} subtitle={subtitle} action={action} className="mb-3" />
      {note}
      <div className="divide-y divide-mist-100">{children}</div>
    </Panel>
  );
}

/** Catatan: GroupChat nonaktif → pengaturan peserta tertunda (tetap bisa diubah). */
function PendingNote() {
  return (
    <p className="mb-1 flex items-start gap-2 rounded-xl bg-warning-50 px-3 py-2.5 text-[13px] leading-relaxed text-warning-700">
      <Hourglass className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      <span>GroupChat sedang nonaktif untuk peserta. Pengaturan di bagian ini tetap disimpan dan langsung berlaku saat GroupChat diaktifkan kembali.</span>
    </p>
  );
}

const PendingPill = () => <StatusPill tone="warning">Berlaku saat aktif</StatusPill>;

/** Kerangka saat memuat. */
function LoadingView() {
  return (
    <div aria-busy="true" aria-label="Memuat pengaturan GroupChat">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {STATS.map((t) => (
          <StatTile key={t.key} title={t.title} icon={t.icon} tone={t.tone} loading compact />
        ))}
      </div>
      <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-12">
        <div className="space-y-3 sm:space-y-4 lg:col-span-7">
          <SkeletonCard height="h-32" />
          <SkeletonCard height="h-72" />
        </div>
        <div className="space-y-3 sm:space-y-4 lg:col-span-5">
          <SkeletonCard height="h-48" />
          <SkeletonCard height="h-40" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Halaman                                                              */
/* ------------------------------------------------------------------ */

export function ChatSettingsView() {
  const toast = useToast();
  // Catat waktu mulai request agar respons lama tidak menimpa hasil simpan yang lebih baru.
  const res = useResource(() => {
    const at = Date.now();
    return api.get('/admin/chat/settings').then((d) => ({ ...(d || {}), _at: at }));
  }, []);

  const [s, setS] = useState(null); // pengaturan lokal (optimistis)
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [days, setDays] = useState('');
  const [daysError, setDaysError] = useState(null);
  const [bulk, setBulk] = useState(null); // { next, confirmText } menunggu konfirmasi
  const [resetOpen, setResetOpen] = useState(false);

  const localRef = useRef(null); // salinan sinkron state lokal
  const savedRef = useRef(null); // nilai terakhir yang dikonfirmasi server
  const pendingRef = useRef(null); // patch (hanya kunci yang diubah) yang belum dikirim
  const extRef = useRef(null); // perubahan dari panel chat yang tiba saat PUT berjalan
  const selfEvent = useRef(false); // abaikan event yang kita kirim sendiri
  const busyRef = useRef(false);
  const lastPutRef = useRef(0);

  const apply = useCallback((next) => {
    localRef.current = next;
    setS(next);
  }, []);

  // Sinkronkan dari server (muat awal, coba lagi, polling) bila tidak sedang menyimpan.
  useEffect(() => {
    if (!res.data || busyRef.current || (res.data._at || 0) < lastPutRef.current) return;
    const n = normalize(res.data.settings);
    savedRef.current = n;
    apply(n);
  }, [res.data, apply]);

  // Input hari mengikuti nilai lokal (termasuk saat rollback). Pesan galat dibiarkan agar 422 tetap terlihat.
  const retention = s?.retention_days;
  useEffect(() => {
    if (retention != null) setDays(String(retention));
  }, [retention]);

  // Segarkan statistik & status (mis. gembok dari panel chat) tiap 30 detik saat tab terlihat.
  const reload = res.reload;
  useEffect(() => {
    const t = setInterval(() => {
      if (!busyRef.current && document.visibilityState === 'visible') reload({ silent: true });
    }, POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  /**
   * Simpan antrean secara berurutan; perubahan beruntun digabung jadi satu PUT berikutnya.
   * Body hanya berisi kunci yang diubah — server menggabungkannya ke pengaturan tersimpan terbaru,
   * jadi gembok dari panel chat (atau admin lain) tidak tertimpa salinan lama halaman ini.
   */
  const flush = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setSaving(true);
    while (pendingRef.current) {
      const body = pendingRef.current;
      pendingRef.current = null;
      lastPutRef.current = Date.now();
      try {
        const r = await api.put('/admin/chat/settings', body);
        let saved = normalize(r?.settings || applyPatch(savedRef.current, body));
        // Perubahan dari panel yang tiba selama PUT tetap dipakai, kecuali kunci yang baru saja kita simpan.
        saved = normalize(applyPatch(saved, omitKeys(extRef.current, body)));
        savedRef.current = saved;
        apply(normalize(applyPatch(saved, pendingRef.current)));
        setSavedOnce(true);
        if (r?.settings) {
          selfEvent.current = true;
          window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: r.settings }));
          selfEvent.current = false;
        }
      } catch (err) {
        // Gagal → kembalikan ke nilai terakhir yang tersimpan & buang antrean.
        pendingRef.current = null;
        apply(savedRef.current);
        const f = err instanceof ApiError && err.fields ? err.fields.retention_days : null;
        if (f) setDaysError(f);
        toast.error('Gagal menyimpan pengaturan', errorMessage(err));
      }
    }
    lastPutRef.current = Date.now();
    busyRef.current = false;
    setSaving(false);
    // Ada perubahan dari panel selama menyimpan → ambil salinan server untuk memastikan.
    if (extRef.current) {
      extRef.current = null;
      reload({ silent: true });
    }
  }, [apply, toast, reload]);

  /** next = tampilan optimistis; patch = hanya kunci yang diubah (dikirim ke server). */
  const commit = useCallback(
    (next, patch) => {
      apply(next);
      pendingRef.current = applyPatch(pendingRef.current, patch);
      flush();
    },
    [apply, flush],
  );

  // Gembok diubah dari panel GroupChat (event dari GroupChat.toggleLock) → pakai nilai terbaru server.
  useEffect(() => {
    const on = (e) => {
      if (selfEvent.current || !e.detail || !savedRef.current) return;
      const ext = diffPatch(savedRef.current, normalize(e.detail));
      lastPutRef.current = Date.now(); // respons polling yang dimulai sebelum ini sudah basi
      if (!ext) return;
      savedRef.current = normalize(applyPatch(savedRef.current, ext));
      if (busyRef.current) extRef.current = applyPatch(extRef.current, ext);
      // Tampilan: nilai eksternal, lalu perubahan lokal yang belum terkirim tetap di atasnya.
      apply(normalize(applyPatch(applyPatch(localRef.current, ext), pendingRef.current)));
    };
    window.addEventListener(SETTINGS_EVENT, on);
    return () => window.removeEventListener(SETTINGS_EVENT, on);
  }, [apply]);

  const toggle = (path) => (val) => commit(setIn(localRef.current, path, val), setIn({}, path, val));

  const saveDays = () => {
    const raw = days.trim();
    const n = Number(raw);
    if (raw === '' || !Number.isInteger(n) || n < MIN_DAYS || n > MAX_DAYS) {
      setDaysError(`Isi bilangan bulat ${MIN_DAYS}–${MAX_DAYS} hari.`);
      return;
    }
    setDaysError(null);
    setDays(String(n));
    if (n !== localRef.current.retention_days) commit({ ...localRef.current, retention_days: n }, { retention_days: n });
  };

  /** Terapkan aksi massal (patch) di atas nilai lokal terkini; ketikan hari yang belum tersimpan ikut diganti. */
  const applyBulk = (patch) => {
    const next = applyPatch(localRef.current, patch);
    setDays(String(next.retention_days));
    setDaysError(null);
    commit(next, patch);
  };

  /** Aksi massal; minta konfirmasi bila berakibat pesan lama terhapus otomatis. */
  const runBulk = (patch, confirmText) => {
    const cur = localRef.current;
    const next = applyPatch(cur, patch);
    const purges = next.auto_delete && (!cur.auto_delete || next.retention_days < cur.retention_days);
    if (purges) setBulk({ patch, days: next.retention_days, confirmText });
    else applyBulk(patch);
  };
  const enableAll = () => runBulk(BOOL_KEYS.reduce((o, k) => setIn(o, k, true), {}), 'Ya, aktifkan semua');
  const restoreDefaults = () => runBulk(normalize(DEFAULTS), 'Ya, kembalikan default');

  const doReset = async () => {
    try {
      await api.post('/admin/chat/reset');
      toast.success('GroupChat direset', 'Semua riwayat pesan dan file telah dihapus.');
      reload({ silent: true });
      return true;
    } catch (err) {
      toast.error('Gagal mereset', errorMessage(err));
      return false;
    }
  };

  const stats = res.data?.stats || {};
  const ready = !!s;
  const peserta = ready && !s.enabled; // pengaturan peserta tertunda
  const attachOn = ready ? ATTACH_KEYS.filter((k) => s.attachments[k]).length : 0;

  const groupPill = !ready ? null : !s.enabled ? (
    <StatusPill tone="danger">Nonaktif untuk peserta</StatusPill>
  ) : !s.peserta_can_send ? (
    <StatusPill tone="warning">Grup ditutup — hanya admin</StatusPill>
  ) : (
    <StatusPill tone="mint">Aktif · grup terbuka</StatusPill>
  );

  const row = (key, label, description) => <Switch key={key} className="py-3.5" checked={!!getIn(s, key)} onChange={toggle(key)} label={label} description={description} />;

  return (
    <div>
      <AdminPageHeader
        title="GroupChat"
        description="Atur fitur GroupChat untuk peserta. Setiap perubahan tersimpan otomatis; admin selalu dapat membuka chat dan memakai semua fitur."
        actions={
          <>
            <Button variant="secondary" icon={<RotateCcw />} onClick={restoreDefaults} disabled={!ready || sameAs(s, DEFAULTS)}>
              Kembalikan default
            </Button>
            <Button icon={<CheckCheck />} onClick={enableAll} disabled={!ready || allOn(s)}>
              Aktifkan semua
            </Button>
          </>
        }
        meta={
          ready && (
            <>
              {groupPill}
              <span className="inline-flex h-6 items-center gap-1.5 text-xs text-mist-700" aria-live="polite">
                {saving ? (
                  <>
                    <Spinner size="xs" label="Menyimpan" /> Menyimpan…
                  </>
                ) : savedOnce ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-mint-700" strokeWidth={2.25} aria-hidden /> Tersimpan
                  </>
                ) : (
                  'Perubahan tersimpan otomatis'
                )}
              </span>
            </>
          )
        }
      />

      {res.error && !ready ? (
        <Panel padding="none">
          <ErrorState error={res.error} title="Gagal memuat pengaturan GroupChat" onRetry={() => reload()} />
        </Panel>
      ) : !ready ? (
        <LoadingView />
      ) : (
        <>
          {/* Statistik */}
          <section aria-label="Statistik GroupChat" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
            {STATS.map((t) => (
              <StatTile key={t.key} title={t.title} info={t.info} icon={t.icon} tone={t.tone} value={num(stats[t.key])} suffix={t.suffix} caption={t.caption} compact />
            ))}
          </section>

          <div className="mt-3 grid items-start gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-12">
            <div className="space-y-3 sm:space-y-4 lg:col-span-7">
              {/* Status grup */}
              <Section icon={s.enabled && s.peserta_can_send ? <LockOpen /> : <Lock />} title="Status grup" subtitle="Buka, tutup, atau nonaktifkan GroupChat untuk peserta.">
                {row('enabled', 'Aktifkan GroupChat untuk peserta', 'Bila nonaktif, peserta tidak melihat GroupChat sama sekali. Admin tetap dapat membuka panel dan mengirim pesan.')}
                {row(
                  'peserta_can_send',
                  'Grup terbuka — peserta bisa mengirim',
                  <>
                    Matikan untuk menutup grup: peserta hanya dapat membaca, hanya admin yang dapat mengirim pesan.
                    {peserta && <span className="mt-1 block text-[13px] font-medium text-warning-700">Berlaku saat GroupChat diaktifkan kembali.</span>}
                  </>,
                )}
                <div className="pt-3.5">
                  <dl className="grid gap-2 rounded-xl bg-ghost px-4 py-3 text-[13px] sm:grid-cols-2">
                    <div>
                      <dt className="text-mist-700">Peserta</dt>
                      <dd className="font-medium text-obsidian">{!s.enabled ? 'Tidak melihat GroupChat' : s.peserta_can_send ? 'Membaca & mengirim pesan' : 'Hanya membaca'}</dd>
                    </div>
                    <div>
                      <dt className="text-mist-700">Admin</dt>
                      <dd className="font-medium text-obsidian">Selalu membaca & mengirim</dd>
                    </div>
                  </dl>
                </div>
              </Section>

              {/* Interaksi */}
              <Section
                icon={<Sparkles />}
                title="Interaksi"
                subtitle="Fitur percakapan yang boleh dipakai peserta."
                action={peserta ? <PendingPill /> : null}
                note={peserta ? <PendingNote /> : null}
              >
                {INTERACTION_ROWS.map((r) => row(r.key, r.label, r.description))}
              </Section>
            </div>

            <div className="space-y-3 sm:space-y-4 lg:col-span-5">
              {/* Lampiran */}
              <Section
                icon={<Paperclip />}
                title="Lampiran"
                subtitle={`Jenis berkas yang boleh dikirim peserta · ${attachOn} dari ${ATTACH_KEYS.length} aktif.`}
                action={peserta ? <PendingPill /> : null}
                note={
                  <>
                    {peserta && <PendingNote />}
                    {attachOn === 0 && (
                      <p className="mb-1 mt-1 rounded-xl bg-ghost px-3 py-2.5 text-[13px] leading-relaxed text-mist-700">Semua lampiran nonaktif — tombol lampiran disembunyikan untuk peserta.</p>
                    )}
                  </>
                }
              >
                {ATTACH_ROWS.map((r) => row(r.key, r.label, r.description))}
              </Section>

              {/* Moderasi */}
              <Section icon={<ShieldCheck />} title="Moderasi" subtitle="Berlaku untuk semua anggota, termasuk admin.">
                {row('profanity_filter', 'Filter kata kasar', 'Sensor otomatis kata tidak pantas pada isi pesan dan nama file.')}
                {row(
                  'auto_delete',
                  'Hapus pesan otomatis',
                  `Pesan lebih lama dari ${s.retention_days} hari dihapus otomatis, kecuali yang berbintang atau disematkan. Info ini hanya terlihat oleh admin di panel chat.`,
                )}
                <div className="py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label htmlFor="gc-retention-days" className="min-w-0 flex-1 cursor-pointer">
                      <span className="block text-sm font-medium text-obsidian">Simpan pesan selama</span>
                      <span className="mt-0.5 block text-sm text-mist-700">
                        {MIN_DAYS}–{MAX_DAYS} hari. Tersimpan saat kolom ditinggalkan atau menekan Enter.
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="gc-retention-days"
                        type="number"
                        inputMode="numeric"
                        min={MIN_DAYS}
                        max={MAX_DAYS}
                        step={1}
                        size="sm"
                        mono
                        value={days}
                        state={daysError ? 'error' : undefined}
                        aria-describedby={daysError ? 'gc-retention-days-msg' : undefined}
                        wrapperClassName="w-28"
                        className="text-right"
                        onChange={(e) => {
                          setDays(e.target.value);
                          if (daysError) setDaysError(null);
                        }}
                        onBlur={saveDays}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveDays();
                          } else if (e.key === 'Escape') {
                            setDays(String(localRef.current.retention_days));
                            setDaysError(null);
                          }
                        }}
                      />
                      <span className="text-sm text-mist-700">hari</span>
                    </div>
                  </div>
                  {daysError && (
                    <p id="gc-retention-days-msg" role="alert" className="mt-2 text-right text-[13px] text-danger-700">
                      {daysError}
                    </p>
                  )}
                  {!s.auto_delete && <p className="mt-2 text-xs text-mist-700">Tidak berlaku selama hapus pesan otomatis nonaktif.</p>}
                </div>
              </Section>

              {/* Zona berbahaya */}
              <section aria-label="Zona berbahaya" className="rounded-[20px] bg-white p-4 ring-1 ring-inset ring-danger/25 sm:p-6">
                <div className="flex items-start gap-3">
                  <IconBox icon={<TriangleAlert />} tone="danger" />
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold leading-6 tracking-[-0.01em] text-obsidian sm:text-[15px]">Zona berbahaya</h2>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-mist-700">
                      Reset menghapus SEMUA riwayat pesan dan file untuk semua anggota, termasuk pesan berbintang, tersemat, dan reaksi. Pengaturan di halaman ini tidak berubah.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="danger-soft" icon={<RotateCcw />} onClick={() => setResetOpen(true)}>
                    Reset GroupChat
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!bulk}
        onClose={() => setBulk(null)}
        onConfirm={() => {
          if (bulk) applyBulk(bulk.patch);
        }}
        title="Aktifkan hapus pesan otomatis?"
        description={
          bulk
            ? `Pesan yang lebih lama dari ${bulk.days} hari akan dihapus pada pembersihan berikutnya (tiap jam), kecuali yang berbintang atau disematkan.`
            : undefined
        }
        confirmText={bulk?.confirmText}
        icon={<Hourglass className="h-5 w-5" />}
      />

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={doReset}
        tone="danger"
        title="Reset GroupChat?"
        description="SEMUA riwayat pesan dan file akan dihapus permanen, termasuk pesan berbintang dan tersemat. Tindakan ini tidak bisa dibatalkan."
        confirmText="Ya, reset semua"
        icon={<RotateCcw className="h-5 w-5" />}
      >
        {res.data?.stats && (
          <p className="rounded-xl bg-danger-50 px-3 py-2.5 text-[13px] text-danger-700">
            <span className="font-semibold tabular-nums">{formatAngka(stats.messages || 0)}</span> pesan dan <span className="font-semibold tabular-nums">{formatAngka(stats.files || 0)}</span> lampiran akan dihapus.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}

export default ChatSettingsView;
