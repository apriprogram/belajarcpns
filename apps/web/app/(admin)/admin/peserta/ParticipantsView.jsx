'use client';

import { useState } from 'react';
import { Eye, FilterX, KeyRound, ShieldBan, ShieldCheck, Trash2, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { formatAngka, formatRelatif, formatTanggal } from '@/lib/format';
import {
  Avatar,
  EmptyState,
  ErrorState,
  Menu,
  Pagination,
  SearchInput,
  Skeleton,
  Table,
  TableContainer,
  TableEmpty,
  TableSkeleton,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/ui';
import { AdminPageHeader, FilterBar, Panel, PanelFooter, StatusPill, TableSkin } from '@/components/admin/AdminUI';
import { Segmented } from '@/components/admin/Segmented';
import { UserActionDialogs, UserDetailModal } from '@/components/admin/UserDetailModal';
import { isOnline, useResource } from '@/components/admin/shared';

function OnlineDot({ lastSeen }) {
  const on = isOnline(lastSeen);
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className={on ? 'relative flex h-2 w-2' : 'flex h-2 w-2'} aria-hidden>
        {on && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-70" />}
        <span className={on ? 'relative h-2 w-2 rounded-full bg-mint ring-2 ring-mint-100' : 'h-2 w-2 rounded-full bg-mist'} />
      </span>
      <span className={on ? 'font-medium text-mint-700' : 'text-mist-700'}>{on ? 'Online' : formatRelatif(lastSeen)}</span>
    </span>
  );
}

export function ParticipantsView() {
  const [f, setF] = useState({ q: '', status: '', page: 1 });
  const [detailId, setDetailId] = useState(null);
  const [action, setAction] = useState(null);
  const list = useResource(() => api.list('/admin/users', { query: { ...f, per_page: 10 } }), [f]);
  const rows = list.data || [];

  const patchRow = (id, patch) => list.setData((r) => (r || []).map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const menuFor = (u) => [
    { label: 'Lihat detail', icon: <Eye />, onClick: () => setDetailId(u.id) },
    { label: 'Reset password', icon: <KeyRound />, onClick: () => setAction({ type: 'reset', user: u }) },
    { divider: true },
    u.status === 'blocked'
      ? { label: 'Aktifkan', icon: <ShieldCheck />, onClick: () => setAction({ type: 'activate', user: u }) }
      : { label: 'Blokir', icon: <ShieldBan />, danger: true, onClick: () => setAction({ type: 'block', user: u }) },
    { label: 'Hapus peserta', icon: <Trash2 />, danger: true, onClick: () => setAction({ type: 'delete', user: u }) },
  ];

  const removeRow = (id) => {
    list.setData((r) => (r || []).filter((x) => x.id !== id));
    if (detailId === id) setDetailId(null);
  };

  const hasFilter = !!(f.q || f.status);
  const empty = hasFilter ? (
    <EmptyState size="sm" icon={<FilterX />} title="Tidak ada peserta yang cocok" description="Ubah kata kunci atau filter status." />
  ) : (
    <EmptyState size="sm" icon={<Users />} title="Belum ada peserta" description="Peserta yang mendaftar akan muncul di sini." />
  );

  return (
    <div>
      <AdminPageHeader title="Peserta" description="Pantau aktivitas peserta, lihat riwayat ujian, dan kelola akses akun." />

      <Panel padding="none" className="overflow-hidden">
        <FilterBar
          left={
            <Segmented
              value={f.status}
              onChange={(v) => setF((s) => ({ ...s, status: v, page: 1 }))}
              ariaLabel="Filter status peserta"
              options={[
                { value: '', label: 'Semua' },
                { value: 'active', label: 'Aktif' },
                { value: 'blocked', label: 'Diblokir' },
              ]}
            />
          }
          right={
            <>
              {list.meta && <span className="hidden text-[13px] text-mist-700 xl:inline">{formatAngka(list.meta.total)} peserta</span>}
              <SearchInput placeholder="Cari nama, email, atau HP…" size="sm" onSearch={(q) => setF((s) => ({ ...s, q: q.trim(), page: 1 }))} className="sm:w-80" shortcut />
            </>
          }
        />

        {list.error ? (
          <ErrorState error={list.error} onRetry={() => list.reload()} />
        ) : (
          <>
            <TableSkin className="hidden md:block">
              <TableContainer className="!rounded-none">
                <Table>
                  <THead>
                    <Tr>
                      <Th>Peserta</Th>
                      <Th>No. HP</Th>
                      <Th>Aktivitas</Th>
                      <Th align="right">Ujian</Th>
                      <Th align="right">Rata-rata</Th>
                      <Th>Status</Th>
                      <Th>Bergabung</Th>
                      <Th align="right">
                        <span className="sr-only">Aksi</span>
                      </Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {list.loading && !rows.length ? (
                      <TableSkeleton rows={6} cols={8} />
                    ) : !rows.length ? (
                      <TableEmpty colSpan={8}>{empty}</TableEmpty>
                    ) : (
                      rows.map((u) => (
                        <Tr key={u.id} onClick={() => setDetailId(u.id)} className={list.loading ? 'opacity-60' : undefined}>
                          <Td>
                            <span className="flex items-center gap-3">
                              <Avatar name={u.name} src={u.avatar_url} size="md" status={isOnline(u.last_seen_at) ? 'online' : undefined} />
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">{u.name}</span>
                                <span className="block truncate text-xs text-mist-700">{u.email}</span>
                              </span>
                            </span>
                          </Td>
                          <Td mono muted nowrap className="text-[13px]">
                            {u.phone || '—'}
                          </Td>
                          <Td nowrap>
                            <OnlineDot lastSeen={u.last_seen_at} />
                          </Td>
                          <Td align="right" className="tabular-nums">
                            {formatAngka(u.attempts_count)}
                          </Td>
                          <Td align="right" className="font-semibold tabular-nums">
                            {u.attempts_count ? formatAngka(u.avg_score, { maxDecimals: 1 }) : '—'}
                          </Td>
                          <Td>
                            <StatusPill status={u.status} />
                          </Td>
                          <Td muted nowrap>
                            {formatTanggal(u.created_at)}
                          </Td>
                          <Td align="right" onClick={(e) => e.stopPropagation()}>
                            <Menu items={menuFor(u)} label={`Aksi untuk ${u.name}`} />
                          </Td>
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </TableContainer>
            </TableSkin>

            <ul className="divide-y divide-mist-100 md:hidden">
              {list.loading && !rows.length
                ? Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-3 p-4">
                      <Skeleton className="h-10 w-10" rounded="rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/2" rounded="rounded-md" />
                        <Skeleton className="h-3 w-2/3" rounded="rounded-md" />
                      </div>
                    </li>
                  ))
                : !rows.length
                  ? <li>{empty}</li>
                  : rows.map((u) => (
                      <li key={u.id} className="flex items-center gap-3 p-4">
                        <button type="button" onClick={() => setDetailId(u.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt">
                          <Avatar name={u.name} src={u.avatar_url} size="md" status={isOnline(u.last_seen_at) ? 'online' : undefined} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold">{u.name}</span>
                              <StatusPill status={u.status} />
                            </span>
                            <span className="block truncate text-xs text-mist-700">{u.email}</span>
                            <span className="mt-1 block text-xs text-mist-700">
                              {formatAngka(u.attempts_count)} ujian · rata-rata {u.attempts_count ? formatAngka(u.avg_score, { maxDecimals: 1 }) : '—'}
                            </span>
                          </span>
                        </button>
                        <Menu items={menuFor(u)} label={`Aksi untuk ${u.name}`} />
                      </li>
                    ))}
            </ul>

            {list.meta && rows.length > 0 && (
              <PanelFooter>
                <Pagination meta={list.meta} onChange={(p) => setF((s) => ({ ...s, page: p }))} />
              </PanelFooter>
            )}
          </>
        )}
      </Panel>

      <UserDetailModal userId={detailId} open={!!detailId} onClose={() => setDetailId(null)} onChanged={patchRow} onDeleted={removeRow} />
      <UserActionDialogs action={action} onClose={() => setAction(null)} onChanged={patchRow} onDeleted={removeRow} />
    </div>
  );
}

export default ParticipantsView;
