'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Code2, Copy, Headset, Inbox, Mail, MailOpen, Phone, RefreshCw, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { formatRelatif, formatTanggalJam } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Avatar, Button, ConfirmDialog, EmptyState, ErrorState, IconButton, SearchInput, Skeleton, useToast } from '@/components/ui';
import { AdminPageHeader, Panel, StatusPill } from '@/components/admin/AdminUI';
import { Segmented } from '@/components/admin/Segmented';
import { copyText, useResource } from '@/components/admin/shared';

const OCCUPATION = {
  siswa: 'Siswa',
  mahasiswa: 'Mahasiswa',
  bekerja: 'Sudah bekerja',
  belum_bekerja: 'Belum bekerja',
  pengusaha: 'Pengusaha',
};

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s || '');
const isPhone = (s) => /^\+?[\d\s-]{8,16}$/.test(s || '');

/** Kotak masuk pesan dari halaman utama (gaya inbox: daftar kiri, isi kanan). */
export function MessagesView() {
  const toast = useToast();
  const [status, setStatus] = useState('semua');
  const [recipient, setRecipient] = useState('');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const { loading, error, data, reload, setData } = useResource(() => api.get('/admin/messages', { query: { status, recipient, q } }), [status, recipient, q]);
  const items = useMemo(() => data?.items || [], [data]);
  const unread = data?.unread ?? 0;
  const total = data?.total ?? 0;
  const selected = items.find((m) => m.id === selectedId) || null;

  // Beri tahu sidebar agar badge jumlah belum dibaca diperbarui.
  useEffect(() => {
    if (data) window.dispatchEvent(new CustomEvent('bisapns:messages-unread', { detail: unread }));
  }, [data, unread]);

  const patchLocal = (id, patch, unreadDelta = 0) =>
    setData((d) => (d ? { ...d, unread: Math.max(0, (d.unread || 0) + unreadDelta), items: d.items.map((m) => (m.id === id ? { ...m, ...patch } : m)) } : d));

  const setRead = async (m, read, { silent } = {}) => {
    if (m.is_read === read) return;
    patchLocal(m.id, { is_read: read }, read ? -1 : 1);
    try {
      await api.patch(`/admin/messages/${m.id}`, { read });
      if (!silent) toast.success(read ? 'Ditandai sudah dibaca' : 'Ditandai belum dibaca');
    } catch (err) {
      patchLocal(m.id, { is_read: !read }, read ? 1 : -1);
      toast.error('Gagal memperbarui pesan', errorMessage(err));
    }
  };

  const open = (m) => {
    setSelectedId(m.id);
    if (!m.is_read) setRead(m, true, { silent: true });
  };

  const remove = async () => {
    const m = toDelete;
    try {
      await api.del(`/admin/messages/${m.id}`);
      setData((d) => (d ? { ...d, total: d.total - 1, unread: d.unread - (m.is_read ? 0 : 1), items: d.items.filter((x) => x.id !== m.id) } : d));
      if (selectedId === m.id) setSelectedId(null);
      toast.success('Pesan dihapus');
    } catch (err) {
      toast.error('Gagal menghapus pesan', errorMessage(err));
      return false;
    }
    return true;
  };

  return (
    <>
      <AdminPageHeader
        title="Pesan masuk"
        description="Pesan dari pengunjung halaman utama untuk admin dan developer."
        actions={
          <Button variant="secondary" icon={<RefreshCw />} onClick={() => reload()}>
            Muat ulang
          </Button>
        }
        meta={
          <>
            <StatusPill tone="cobalt">{unread} belum dibaca</StatusPill>
            <StatusPill tone="mist">{total} total</StatusPill>
          </>
        }
      />

      <Panel padding="none" className="overflow-hidden">
        <div className="grid min-h-[360px] sm:min-h-[620px] lg:grid-cols-[400px_minmax(0,1fr)]">
          {/* ---------- Daftar ---------- */}
          <section aria-label="Daftar pesan" className={cn('flex min-w-0 flex-col border-mist-100 lg:border-r', selected && 'hidden lg:flex')}>
            <div className="space-y-2.5 border-b border-mist-100 p-4">
              <SearchInput size="sm" placeholder="Cari nama, isi, kontak…" onSearch={setQ} ariaLabel="Cari pesan" />
              <div className="flex flex-wrap items-center gap-2">
                <Segmented
                  size="sm"
                  ariaLabel="Status baca"
                  value={status}
                  onChange={setStatus}
                  options={[
                    { value: 'semua', label: 'Semua' },
                    { value: 'belum', label: 'Belum dibaca', count: unread },
                    { value: 'sudah', label: 'Dibaca' },
                  ]}
                />
                <Segmented
                  size="sm"
                  ariaLabel="Tujuan"
                  value={recipient}
                  onChange={setRecipient}
                  options={[
                    { value: '', label: 'Semua' },
                    { value: 'admin', label: 'Admin' },
                    { value: 'developer', label: 'Dev' },
                  ]}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && !data ? (
                <div className="space-y-1 p-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex gap-3 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3.5 w-1/2" />
                        <Skeleton className="h-3 w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <ErrorState className="m-4" description={errorMessage(error)} onRetry={() => reload()} />
              ) : items.length === 0 ? (
                <EmptyState
                  className="m-4"
                  icon={<Inbox />}
                  title={q || status !== 'semua' || recipient ? 'Tidak ada pesan yang cocok' : 'Belum ada pesan'}
                  description={q || status !== 'semua' || recipient ? 'Ubah filter atau kata kunci pencarian.' : 'Pesan dari formulir "Kirim pesan" di halaman utama akan muncul di sini.'}
                />
              ) : (
                <ul className="divide-y divide-mist-100">
                  {items.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => open(m)}
                        aria-current={selectedId === m.id ? 'true' : undefined}
                        className={cn(
                          'relative flex w-full gap-3 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cobalt',
                          selectedId === m.id ? 'bg-cobalt-50/60' : 'hover:bg-mist-50',
                        )}
                      >
                        {selectedId === m.id && <span className="absolute inset-y-0 left-0 w-[3px] bg-cobalt" aria-hidden />}
                        <Avatar name={m.name} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className={cn('truncate text-sm', m.is_read ? 'font-medium text-obsidian-600' : 'font-semibold text-obsidian')}>{m.name}</span>
                            <span className="ml-auto shrink-0 text-[11px] text-mist-700">{formatRelatif(m.created_at)}</span>
                          </span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-mist-700">
                            {m.recipient === 'developer' ? <Code2 className="h-3 w-3" /> : <Headset className="h-3 w-3" />}
                            {m.recipient === 'developer' ? 'Developer' : 'Admin'} · {OCCUPATION[m.occupation] || m.occupation}
                          </span>
                          <span className={cn('mt-1 line-clamp-2 text-[13px] leading-snug', m.is_read ? 'text-mist-700' : 'text-obsidian-600')}>{m.body}</span>
                        </span>
                        {!m.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cobalt" aria-label="Belum dibaca" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ---------- Isi pesan ---------- */}
          <section aria-label="Isi pesan" className={cn('min-w-0 flex-col', selected ? 'flex' : 'hidden lg:flex')}>
            {selected ? (
              <MessageDetail
                m={selected}
                onBack={() => setSelectedId(null)}
                onToggleRead={() => setRead(selected, !selected.is_read)}
                onDelete={() => setToDelete(selected)}
                onCopy={async () => ((await copyText(selected.contact)) ? toast.success('Kontak disalin') : toast.error('Gagal menyalin'))}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ghost text-mist-700">
                  <MailOpen className="h-6 w-6" />
                </span>
                <p className="mt-4 text-[14px] font-semibold sm:text-[15px]">Pilih pesan</p>
                <p className="mt-1 max-w-xs text-sm text-mist-700">Klik salah satu pesan di kiri untuk membaca isinya.</p>
              </div>
            )}
          </section>
        </div>
      </Panel>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={remove}
        tone="danger"
        title="Hapus pesan ini?"
        description={toDelete ? `Pesan dari ${toDelete.name} akan dihapus permanen.` : ''}
        confirmText="Ya, hapus"
        icon={<Trash2 className="h-[22px] w-[22px]" />}
      />
    </>
  );
}

function MessageDetail({ m, onBack, onToggleRead, onDelete, onCopy }) {
  const email = isEmail(m.contact);
  const phone = !email && isPhone(m.contact);
  return (
    <>
      <div className="flex items-center gap-2 border-b border-mist-100 px-4 py-3 sm:px-6">
        <IconButton icon={<ArrowLeft />} label="Kembali ke daftar" variant="ghost" size="sm" className="lg:hidden" onClick={onBack} />
        <StatusPill tone={m.recipient === 'developer' ? 'warning' : 'cobalt'}>Untuk {m.recipient === 'developer' ? 'developer' : 'admin'}</StatusPill>
        <div className="ml-auto flex items-center gap-1 max-sm:gap-2">
          <Button variant="ghost" size="sm" icon={m.is_read ? <Mail /> : <MailOpen />} onClick={onToggleRead} aria-label={m.is_read ? 'Tandai belum dibaca' : 'Tandai dibaca'} title={m.is_read ? 'Tandai belum dibaca' : 'Tandai dibaca'} className="max-sm:!px-0">
            <span className="hidden sm:inline">{m.is_read ? 'Tandai belum dibaca' : 'Tandai dibaca'}</span>
          </Button>
          <IconButton icon={<Trash2 />} label="Hapus pesan" variant="ghost" size="sm" className="text-danger-700" onClick={onDelete} />
        </div>
      </div>

      <article className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-8">
        <header className="flex items-start gap-3 sm:gap-4">
          <Avatar name={m.name} size="lg" />
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold tracking-tight sm:text-xl">{m.name}</h2>
            <p className="mt-0.5 text-sm text-mist-700">
              {OCCUPATION[m.occupation] || m.occupation} · {formatTanggalJam(m.created_at)}
            </p>
          </div>
        </header>

        <div className="mt-5 rounded-2xl bg-ghost p-4 sm:mt-6 sm:px-5 sm:py-5">
          <p className="whitespace-pre-line break-words text-[14px] leading-relaxed text-obsidian sm:text-[15px]">{m.body}</p>
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl px-4 py-3 ring-1 ring-inset ring-mist-100">
            <dt className="text-xs text-mist-700">Kontak</dt>
            <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
              {m.contact ? (
                <>
                  <span className="truncate">{m.contact}</span>
                  <IconButton icon={<Copy />} label="Salin kontak" variant="ghost" size="sm" className="ml-auto" onClick={onCopy} />
                </>
              ) : (
                <span className="text-mist-500">Tidak dicantumkan</span>
              )}
            </dd>
          </div>
          <div className="rounded-2xl px-4 py-3 ring-1 ring-inset ring-mist-100">
            <dt className="text-xs text-mist-700">Status</dt>
            <dd className="mt-1 text-sm font-medium">{m.is_read ? `Dibaca ${m.read_at ? formatRelatif(m.read_at) : ''}` : 'Belum dibaca'}</dd>
          </div>
        </dl>

        {(email || phone) && (
          <div className="mt-6">
            <Button
              href={email ? `mailto:${m.contact}?subject=${encodeURIComponent('Balasan pesan BISA-PNS')}` : `https://wa.me/${m.contact.replace(/\D/g, '').replace(/^0/, '62')}`}
              icon={email ? <Mail /> : <Phone />}
              className="max-sm:w-full"
            >
              {email ? 'Balas lewat email' : 'Balas lewat WhatsApp'}
            </Button>
          </div>
        )}
      </article>
    </>
  );
}

export default MessagesView;
