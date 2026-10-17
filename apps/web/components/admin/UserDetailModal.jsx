'use client';

import { useMemo, useState } from 'react';
import { BadgeCheck, Cake, CalendarDays, Clock3, Copy, Download, ExternalLink, KeyRound, Mail, MapPin, MonitorSmartphone, Phone, ShieldBan, ShieldCheck, Trash2, Trophy, UserRound, Users } from 'lucide-react';
import { genderLabel } from '@/components/profile/GenderPicker';
import { formatTTL, formatUmur } from '@/components/profile/profile-utils';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAngka, formatDurasi, formatRelatif, formatTanggal, formatTanggalJam } from '@/lib/format';
import {
  Avatar,
  Button,
  Chip,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Menu,
  Modal,
  Skeleton,
  Table,
  TableContainer,
  TableEmpty,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
} from '@/components/ui';
import { InfoRow, SectionLabel, SummaryGrid } from './AdminParts';
import { ModalTitle, StatusPill, TABLE_SKIN } from './AdminUI';
import { Segmented } from './Segmented';
import { copyText, isOnline, shortCode, useResource } from './shared';

/**
 * Dialog aksi peserta: blokir/aktifkan & reset password (dengan tampilan password sementara).
 * action: { type: 'block' | 'activate' | 'reset', user } | null
 */
export function UserActionDialogs({ action, onClose, onChanged, onDeleted }) {
  const toast = useToast();
  const [temp, setTemp] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const u = action?.user;
  const isStatus = action && (action.type === 'block' || action.type === 'activate');
  return (
    <>
      <ConfirmDialog
        open={!!isStatus}
        onClose={onClose}
        tone={action?.type === 'block' ? 'danger' : 'default'}
        icon={action?.type === 'block' ? <ShieldBan className="h-[22px] w-[22px]" /> : <ShieldCheck className="h-[22px] w-[22px]" />}
        title={action?.type === 'block' ? `Blokir ${u?.name}?` : `Aktifkan kembali ${u?.name}?`}
        description={
          action?.type === 'block'
            ? 'Peserta langsung dikeluarkan dari semua sesi dan tidak dapat masuk atau mengerjakan ujian sampai diaktifkan kembali.'
            : 'Peserta dapat masuk dan mengerjakan latihan maupun tryout kembali.'
        }
        confirmText={action?.type === 'block' ? 'Ya, blokir' : 'Ya, aktifkan'}
        onConfirm={async () => {
          const status = action.type === 'block' ? 'blocked' : 'active';
          try {
            await api.patch(`/admin/users/${u.id}/status`, { status });
            toast.success(status === 'blocked' ? 'Peserta diblokir' : 'Peserta diaktifkan', u.name);
            onChanged && onChanged(u.id, { status });
          } catch (err) {
            toast.error('Gagal mengubah status', errorMessage(err));
            return false;
          }
        }}
      />
      <ConfirmDialog
        open={action?.type === 'reset'}
        onClose={onClose}
        icon={<KeyRound className="h-[22px] w-[22px]" />}
        title={`Reset password ${u?.name}?`}
        description="Password lama tidak berlaku lagi. Sistem membuat password sementara yang perlu Anda sampaikan ke peserta."
        confirmText="Ya, reset password"
        onConfirm={async () => {
          try {
            const r = await api.post(`/admin/users/${u.id}/reset-password`);
            setTemp({ name: u.name, email: u.email, password: r.temp_password });
            toast.success('Password direset', u.name);
          } catch (err) {
            toast.error('Gagal mereset password', errorMessage(err));
            return false;
          }
        }}
      />
      <ConfirmDialog
        open={action?.type === 'delete'}
        onClose={() => {
          setConfirmText('');
          onClose();
        }}
        tone="danger"
        icon={<Trash2 className="h-[22px] w-[22px]" />}
        title={`Hapus ${u?.name} permanen?`}
        description="Akun, foto profil, data diri, riwayat latihan, tryout/ujian, hasil, target, dan pesan GroupChat peserta ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
        confirmText="Hapus permanen"
        onConfirm={async () => {
          if (confirmText.trim().toUpperCase() !== 'HAPUS') {
            toast.warning('Konfirmasi belum sesuai', 'Ketik HAPUS untuk melanjutkan.');
            return false;
          }
          try {
            await api.del(`/admin/users/${u.id}`);
            toast.success('Peserta dihapus', `${u.name} beserta seluruh datanya telah dihapus.`);
            setConfirmText('');
            onDeleted && onDeleted(u.id);
          } catch (err) {
            toast.error('Gagal menghapus peserta', errorMessage(err));
            return false;
          }
        }}
      >
        <label className="block text-sm">
          <span className="text-mist-700">
            Ketik <b className="font-mono text-danger-700">HAPUS</b> untuk konfirmasi
          </span>
          <Input className="mt-2" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="HAPUS" autoComplete="off" aria-label="Ketik HAPUS untuk konfirmasi" />
        </label>
      </ConfirmDialog>
      <Modal
        open={!!temp}
        onClose={() => setTemp(null)}
        title={<ModalTitle icon={<KeyRound />}>Password berhasil direset</ModalTitle>}
        description={temp ? `Sampaikan password ini kepada ${temp.name} (${temp.email}) melalui kanal yang aman. Password hanya ditampilkan sekali.` : ''}
        size="sm"
        footer={<Button onClick={() => setTemp(null)}>Selesai</Button>}
      >
        {temp && (
          <div className="flex items-center gap-3 rounded-xl bg-ghost p-4">
            <code className="min-w-0 flex-1 select-all break-all font-mono text-lg font-semibold tracking-wide">{temp.password}</code>
            <Button
              size="sm"
              variant="secondary"
              icon={<Copy />}
              data-autofocus
              onClick={async () => {
                const ok = await copyText(temp.password);
                ok ? toast.success('Password disalin') : toast.error('Gagal menyalin', 'Salin secara manual.');
              }}
            >
              Salin
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

/** Modal detail peserta (pola referensi: profil + info, ringkasan 4 kartu, tabel riwayat + ekspor CSV). */
export function UserDetailModal({ userId, open, onClose, onChanged, onDeleted }) {
  const toast = useToast();
  const [filter, setFilter] = useState('semua');
  const [exporting, setExporting] = useState(false);
  const [action, setAction] = useState(null);
  const res = useResource(() => (userId ? api.get(`/admin/users/${userId}`) : Promise.resolve(null)), [userId]);
  const d = res.data;
  const u = d?.user;
  const s = d?.summary || {};
  const history = useMemo(() => (d?.history || []).filter((h) => filter === 'semua' || (filter === 'lulus' ? h.passed : !h.passed)), [d, filter]);
  const online = u && isOnline(u.last_seen_at);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await api.download(`/admin/users/${userId}/export`);
      toast.success('Ekspor dimulai', 'Riwayat peserta sedang diunduh.');
    } catch (err) {
      toast.error('Gagal mengekspor', errorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={<ModalTitle icon={<UserRound />}>Detail peserta</ModalTitle>}
        size="xl"
        footer={
          u && (
            /* Mobile: tombol 2×2 agar isi modal tidak terdesak; ≥ 640px `contents` → tata letak footer bawaan. */
            <div className="grid w-full grid-cols-2 gap-2 sm:contents max-sm:[&>*]:!px-2.5">
              <Button variant="secondary" icon={<KeyRound />} onClick={() => setAction({ type: 'reset', user: u })}>
                Reset password
              </Button>
              <Button variant="ghost" icon={<Trash2 />} onClick={() => setAction({ type: 'delete', user: u })} className="text-danger-700 hover:!bg-danger-50 sm:mr-auto">
                Hapus
              </Button>
              {u.status === 'blocked' ? (
                <Button variant="mint" icon={<ShieldCheck />} onClick={() => setAction({ type: 'activate', user: u })}>
                  Aktifkan
                </Button>
              ) : (
                <Button variant="danger-soft" icon={<ShieldBan />} onClick={() => setAction({ type: 'block', user: u })}>
                  Blokir
                </Button>
              )}
              <Button onClick={onClose}>Tutup</Button>
            </div>
          )
        }
      >
        {res.error ? (
          <ErrorState error={res.error} onRetry={() => res.reload()} />
        ) : !d ? (
          <div className="space-y-5" aria-busy="true">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <Skeleton className="h-44" rounded="rounded-[20px]" />
              <Skeleton className="h-44" rounded="rounded-[20px]" />
            </div>
            <Skeleton className="h-20" rounded="rounded-2xl" />
            <Skeleton className="h-48" rounded="rounded-2xl" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 rounded-[20px] p-2 ring-1 ring-inset ring-mist-100 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-[14px] bg-ghost p-4 sm:p-5">
                <Avatar name={u.name} src={u.avatar_url} size="xl" status={online ? 'online' : undefined} className="[&>img]:!h-20 [&>img]:!w-20 [&>span:first-child]:!h-20 [&>span:first-child]:!w-20 [&>span:first-child]:!text-2xl" />
                <p className="mt-4 flex items-center gap-1.5 font-mono text-xs text-mist-700">
                  {shortCode(u.id, 'PST')}
                  <button
                    type="button"
                    onClick={async () => (await copyText(u.id)) && toast.success('ID peserta disalin')}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-mist-500 hover:bg-white hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40"
                    aria-label="Salin ID peserta"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight">
                  {u.name} <StatusPill status={u.status} />
                </p>
                <p className="mt-0.5 text-sm text-mist-700">{online ? 'Sedang online' : `Terakhir aktif ${formatRelatif(u.last_seen_at)}`}</p>
              </div>
              <div className="px-3 py-2">
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">
                  {u.email}
                </InfoRow>
                <InfoRow icon={<Phone className="h-4 w-4" />} label="No. HP">
                  <span className="font-mono">{u.phone || '—'}</span>
                </InfoRow>
                <InfoRow icon={<Users className="h-4 w-4" />} label="Jenis kelamin">
                  {genderLabel(u.gender)}
                </InfoRow>
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Tempat, tgl lahir">
                  {formatTTL(u.birth_place, u.birth_date)}
                </InfoRow>
                <InfoRow icon={<Cake className="h-4 w-4" />} label="Umur">
                  {formatUmur(u.birth_date)}
                </InfoRow>
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Alamat">
                  <span className="whitespace-pre-line break-words">{u.address || '—'}</span>
                </InfoRow>
                <InfoRow icon={<CalendarDays className="h-4 w-4" />} label="Bergabung">
                  {formatTanggal(u.created_at, 'long')}
                </InfoRow>
                <InfoRow icon={<Clock3 className="h-4 w-4" />} label="Waktu belajar">
                  <span className="rounded-lg bg-ghost px-2 py-1 text-[13px]">{formatDurasi(s.study_minutes, { unit: 'minutes' })}</span>
                </InfoRow>
                <InfoRow icon={<MonitorSmartphone className="h-4 w-4" />} label="Pindah tab">
                  <span className="rounded-lg bg-ghost px-2 py-1 text-[13px] tabular-nums">{formatAngka(s.tab_switches)} kali</span>
                </InfoRow>
              </div>
            </div>

            <SectionLabel className="mt-6">Ringkasan</SectionLabel>
            <SummaryGrid
              items={[
                { label: 'Total ujian', value: formatAngka(s.attempts) },
                { label: 'Rata-rata skor', value: formatAngka(s.avg_score, { maxDecimals: 1 }) },
                { label: 'Lulus', value: formatAngka(s.passed), tone: s.passed ? 'mint' : undefined },
                { label: 'Tidak lulus', value: formatAngka(s.failed), tone: s.failed ? 'danger' : undefined },
              ]}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip size="sm" color="mint" icon={<Trophy />}>
                Skor terbaik {formatAngka(s.best_score)}
              </Chip>
              <Chip size="sm" color="warning" icon={<MonitorSmartphone />}>
                {formatAngka(s.tab_switches)} kali pindah tab
              </Chip>
              <Chip size="sm" color="cobalt" icon={<Clock3 />}>
                {formatAngka(s.study_minutes)} menit belajar
              </Chip>
            </div>

            <div className="mb-3 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[15px] font-semibold">Riwayat ujian</p>
              <div className="flex flex-wrap items-center gap-2">
                <Segmented
                  size="sm"
                  value={filter}
                  onChange={setFilter}
                  ariaLabel="Filter riwayat"
                  options={[
                    { value: 'semua', label: 'Semua' },
                    { value: 'lulus', label: 'Lulus' },
                    { value: 'gagal', label: 'Tidak lulus' },
                  ]}
                />
                <Button size="sm" icon={<Download />} onClick={exportCsv} loading={exporting}>
                  Export CSV
                </Button>
              </div>
            </div>
            <TableContainer className={cn('ring-1 ring-inset ring-mist-100', TABLE_SKIN)}>
              <Table className="min-w-[680px]">
                <THead>
                  <Tr>
                    <Th>Tanggal</Th>
                    <Th>Paket</Th>
                    <Th align="right">TWK · TIU · TKP</Th>
                    <Th align="right">Total</Th>
                    <Th>Durasi</Th>
                    <Th>Status</Th>
                    <Th align="right">
                      <span className="sr-only">Aksi</span>
                    </Th>
                  </Tr>
                </THead>
                <TBody>
                  {!history.length ? (
                    <TableEmpty colSpan={7}>
                      <EmptyState size="sm" icon={<BadgeCheck />} title={d.history?.length ? 'Tidak ada riwayat dengan filter ini' : 'Belum ada riwayat ujian'} />
                    </TableEmpty>
                  ) : (
                    history.map((h) => (
                      <Tr key={h.attempt_id}>
                        <Td nowrap>{formatTanggalJam(h.created_at, { wib: false })}</Td>
                        <Td className="max-w-[200px] truncate font-medium">{h.package_title}</Td>
                        <Td align="right" mono muted nowrap className="text-xs">
                          {h.score_twk} · {h.score_tiu} · {h.score_tkp}
                        </Td>
                        <Td align="right" className="font-semibold tabular-nums">
                          {formatAngka(h.score_total)}
                        </Td>
                        <Td nowrap>
                          <span className="rounded-lg bg-ghost px-2 py-1 text-xs">{formatDurasi(h.duration_seconds)}</span>
                        </Td>
                        <Td>
                          <StatusPill status={h.passed ? 'lulus' : 'gagal'} />
                        </Td>
                        <Td align="right">
                          <Menu
                            vertical
                            label="Aksi riwayat"
                            items={[
                              { label: 'Lihat hasil & pembahasan', icon: <ExternalLink />, href: `/hasil/${h.attempt_id}` },
                              { label: 'Laporan paket', icon: <Trophy />, href: `/admin/laporan?paket=${h.package_id}` },
                            ]}
                          />
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Modal>
      <UserActionDialogs
        action={action}
        onClose={() => setAction(null)}
        onDeleted={(id) => {
          setAction(null);
          onDeleted && onDeleted(id);
          onClose && onClose();
        }}
        onChanged={(id, patch) => {
          res.setData((x) => (x ? { ...x, user: { ...x.user, ...patch } } : x));
          onChanged && onChanged(id, patch);
        }}
      />
    </>
  );
}

export default UserDetailModal;
