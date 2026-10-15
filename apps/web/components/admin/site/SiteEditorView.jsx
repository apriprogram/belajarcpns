'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ExternalLink, Eye, RotateCcw, Save, Undo2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatRelatif } from '@/lib/format';
import { SITE_DEFAULTS, mergeSite } from '@/lib/site-defaults';
import { useSiteActions } from '@/components/providers/SiteProvider';
import { Button, ConfirmDialog, ErrorState, Skeleton, useToast } from '@/components/ui';
import { AdminPageHeader, Panel, PanelHeader } from '@/components/admin/AdminUI';
import { EDITORS } from './editors';
import { EditorProvider } from './fields';
import { SitePreview } from './SitePreview';
import { GROUPS, errorCountByGroup, groupDirty, groupOfPath, setIn, validateSite } from './utils';

const clone = (o) => JSON.parse(JSON.stringify(o ?? {}));

/** Halaman admin "Atur Website" — editor CMS beranda & branding (docs/SITE-CMS.md). */
export function SiteEditorView() {
  const toast = useToast();
  const { setSite } = useSiteActions();
  const [state, setState] = useState({ loading: true, error: null });
  const [saved, setSaved] = useState(null); // hasil merge versi tersimpan
  const [draft, setDraft] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [active, setActive] = useState('branding');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const res = await api.get('/site');
      const merged = mergeSite(SITE_DEFAULTS, (res && res.site) || {});
      setSaved(merged);
      setDraft(clone(merged));
      setUpdatedAt((res && res.updated_at) || null);
      setState({ loading: false, error: null });
    } catch (err) {
      setState({ loading: false, error: err });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const dirty = useMemo(() => !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const errors = useMemo(() => (draft ? validateSite(draft) : {}), [draft]);
  const errorCount = Object.keys(errors).length;
  const perGroup = useMemo(() => errorCountByGroup(errors), [errors]);

  // Peringatan saat menutup/memuat ulang tab dengan perubahan belum disimpan.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const set = useCallback((path, value) => setDraft((d) => setIn(d, path, value)), []);
  const ctx = useMemo(() => ({ site: draft, set, errors, setUploading }), [draft, set, errors]);

  const save = async () => {
    if (errorCount) {
      setShowErrors(true);
      const first = groupOfPath(Object.keys(errors)[0]);
      if (first) setActive(first);
      toast.error('Belum bisa disimpan', `Perbaiki ${errorCount} isian yang ditandai merah.`);
      return;
    }
    if (uploading) {
      toast.error('Tunggu sebentar', 'Masih ada file yang sedang diunggah.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put('/admin/site', draft);
      const raw = (res && res.site) || draft;
      const merged = mergeSite(SITE_DEFAULTS, raw);
      setSaved(merged);
      setDraft(clone(merged));
      setUpdatedAt((res && res.updated_at) || new Date().toISOString());
      setSite(raw);
      setShowErrors(false);
      toast.success('Website diperbarui', 'Perubahan langsung tampil di halaman publik.');
    } catch (err) {
      toast.error('Gagal menyimpan', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const revert = () => {
    if (!saved) return;
    setDraft(clone(saved));
    setShowErrors(false);
    toast('Perubahan dibatalkan');
  };

  const resetDefault = async () => {
    try {
      const res = await api.del('/admin/site');
      const raw = (res && res.site) || {};
      const merged = mergeSite(SITE_DEFAULTS, raw);
      setSaved(merged);
      setDraft(clone(merged));
      setUpdatedAt(null);
      setSite(raw);
      setShowErrors(false);
      toast.success('Dikembalikan ke default', 'Semua konten website memakai isi bawaan.');
    } catch (err) {
      toast.error('Gagal mengembalikan default', errorMessage(err));
      throw err; // biarkan dialog tetap terbuka
    }
  };

  const group = GROUPS.find((g) => g.id === active) || GROUPS[0];
  const Editor = EDITORS[group.id];

  const actions = (
    <>
      <Button variant="ghost" size="sm" icon={<ExternalLink />} href="/" target="_blank" rel="noopener noreferrer">
        Lihat website
      </Button>
      <Button variant="secondary" size="sm" icon={<RotateCcw />} onClick={() => setConfirmReset(true)} disabled={state.loading || saving}>
        Kembalikan default
      </Button>
      <Button variant="secondary" size="sm" icon={<Undo2 />} onClick={revert} disabled={!dirty || saving}>
        Batalkan perubahan
      </Button>
      <Button variant="accent" size="sm" icon={<Save />} onClick={save} loading={saving} disabled={!dirty || state.loading || uploading > 0}>
        Simpan
      </Button>
    </>
  );

  const meta = !state.loading && !state.error && (
    <>
      {dirty ? (
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-warning-50 px-2.5 text-xs font-semibold text-warning-700">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
          Ada perubahan belum disimpan
        </span>
      ) : (
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-ghost px-2.5 text-xs font-medium text-mist-700">
          <span className="h-1.5 w-1.5 rounded-full bg-mint" aria-hidden />
          {updatedAt ? `Tersimpan · diperbarui ${formatRelatif(updatedAt)}` : 'Memakai isi bawaan'}
        </span>
      )}
      {uploading > 0 && <span className="inline-flex h-7 items-center rounded-full bg-cobalt-50 px-2.5 text-xs font-semibold text-cobalt-700">Mengunggah {uploading} file…</span>}
      {showErrors && errorCount > 0 && (
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-danger-50 px-2.5 text-xs font-semibold text-danger-700">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          {errorCount} isian perlu diperbaiki
        </span>
      )}
    </>
  );

  return (
    <div>
      <AdminPageHeader title="Atur Website" description="Ubah branding dan seluruh isi halaman utama tanpa menyentuh kode." actions={actions} meta={meta} />

      {state.loading && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[200px_minmax(0,1fr)_320px]">
          <Skeleton className="h-11 rounded-[20px] lg:col-span-2 xl:col-span-1 xl:h-72" />
          <Skeleton className="h-[480px] rounded-[20px]" />
          <Skeleton className="hidden h-72 rounded-[20px] lg:block" />
        </div>
      )}

      {state.error && (
        <Panel>
          <ErrorState error={state.error} title="Gagal memuat pengaturan website" onRetry={load} />
        </Panel>
      )}

      {!state.loading && !state.error && draft && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[200px_minmax(0,1fr)_320px]">
          {/* Daftar grup: vertikal di desktop, pill bar gulir horizontal di mobile */}
          <nav aria-label="Bagian website" className="min-w-0 lg:col-span-2 xl:sticky xl:top-4 xl:col-span-1 xl:self-start">
            <ul className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] xl:mx-0 xl:flex-col xl:gap-0.5 xl:overflow-visible xl:rounded-[20px] xl:bg-white xl:p-1.5 xl:ring-1 xl:ring-inset xl:ring-mist-100">
              {GROUPS.map((g) => {
                const isActive = g.id === active;
                const changed = groupDirty(g, draft, saved);
                const errs = perGroup[g.id] || 0;
                return (
                  <li key={g.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActive(g.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt xl:rounded-xl xl:px-3',
                        isActive ? 'bg-obsidian text-white xl:bg-ghost xl:text-obsidian' : 'bg-white text-obsidian-600 ring-1 ring-inset ring-mist-100 hover:text-obsidian xl:bg-transparent xl:ring-0 xl:hover:bg-ghost',
                      )}
                    >
                      <span className="flex-1 text-left">{g.label}</span>
                      {errs > 0 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-semibold text-white" aria-label={`${errs} kesalahan`}>
                          {errs}
                        </span>
                      ) : (
                        changed && <span className="h-1.5 w-1.5 rounded-full bg-cobalt" aria-label="Diubah" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Panel padding="lg" className="min-w-0">
            <PanelHeader title={group.label} subtitle={groupDirty(group, draft, saved) ? 'Ada perubahan di bagian ini.' : 'Belum ada perubahan.'} />
            <EditorProvider value={ctx}>
              <div className="space-y-4">{Editor && <Editor />}</div>
            </EditorProvider>
            {/* Pratinjau ringkas untuk layar < lg */}
            <details className="mt-5 rounded-2xl bg-ghost p-4 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-obsidian">
                <Eye className="h-4 w-4" aria-hidden />
                Pratinjau
              </summary>
              <div className="mt-3">
                <SitePreview group={group.id} site={draft} />
              </div>
            </details>
          </Panel>

          <aside className="hidden min-w-0 lg:block">
            <Panel className="sticky top-4">
              <PanelHeader title="Pratinjau" subtitle={group.label} icon={<Eye />} />
              <SitePreview group={group.id} site={draft} />
            </Panel>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetDefault}
        tone="danger"
        title="Kembalikan ke default?"
        description="Semua branding dan isi halaman yang sudah diatur akan dihapus dan diganti isi bawaan. File yang sudah diunggah tidak ikut dihapus."
        confirmText="Ya, kembalikan"
      />
    </div>
  );
}

export default SiteEditorView;
