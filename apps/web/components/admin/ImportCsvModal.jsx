'use client';

import { useRef, useState } from 'react';
import { CheckCircle2, CloudUpload, Download, FileSpreadsheet, FileUp, RotateCw, X } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatAngka } from '@/lib/format';
import { Button, Modal, Table, TableContainer, TBody, Td, Th, THead, Tr, useToast } from '@/components/ui';
import { FormAlert } from '@/components/auth/AuthParts';
import { ModalTitle, TABLE_SKIN } from './AdminUI';

/** Modal import soal dari CSV: unduh template → unggah → hasil (jumlah sukses / tabel error per baris). */
export function ImportCsvModal({ open, onClose, onImported }) {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null); // {inserted}
  const [rowErrors, setRowErrors] = useState(null); // [{row,message}]
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setRowErrors(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const close = () => {
    if (busy) return;
    reset();
    onClose && onClose();
  };

  const pick = (f) => {
    setResult(null);
    setRowErrors(null);
    setError(null);
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) {
      setError('File harus berformat .csv');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5 MB.');
      return;
    }
    setFile(f);
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      await api.download('/admin/questions/template', 'template-soal-bisapns.csv');
    } catch (err) {
      toast.error('Gagal mengunduh template', errorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setRowErrors(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.upload('/admin/questions/import', fd);
      setResult(r || { inserted: 0 });
      toast.success('Import berhasil', `${formatAngka(r?.inserted || 0)} soal ditambahkan ke bank soal.`);
      onImported && onImported(r);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'IMPORT_ERROR' && Array.isArray(err.data?.errors)) {
        setRowErrors(err.data.errors);
        toast.error('Import dibatalkan', `${err.data.errors.length} baris bermasalah. Tidak ada soal yang disimpan.`);
      } else {
        setError(errorMessage(err));
        toast.error('Import gagal', errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={<ModalTitle icon={<FileUp />}>Import soal dari CSV</ModalTitle>}
      description="Unggah banyak soal sekaligus. Import bersifat semua-atau-tidak: bila ada baris salah, tidak ada yang disimpan."
      size="lg"
      footer={
        result ? (
          <>
            <Button variant="secondary" icon={<RotateCw />} onClick={reset}>
              Import file lain
            </Button>
            <Button onClick={close}>Selesai</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={close} disabled={busy}>
              Batal
            </Button>
            <Button icon={<FileUp />} onClick={upload} loading={busy} disabled={!file}>
              Unggah &amp; import
            </Button>
          </>
        )
      }
    >
      <ol className="space-y-6">
        <li>
          <p className="text-[15px] font-semibold">1. Unduh template</p>
          <p className="mt-0.5 text-sm text-mist-700">Isi soal mengikuti kolom template agar dapat dibaca sistem.</p>
          <div className="mt-3 flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-inset ring-mist-100 sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint-50 text-mint-700" aria-hidden>
              <FileSpreadsheet className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-mist-700">
              Kolom: subtes, kategori, kesulitan, status, soal, opsi_a–e, bobot_a–e, pembahasan, gambar_url. Pemisah <code className="rounded bg-ghost px-1 font-mono text-xs text-obsidian">;</code> atau{' '}
              <code className="rounded bg-ghost px-1 font-mono text-xs text-obsidian">,</code>.
            </p>
            <Button variant="secondary" size="sm" icon={<Download />} onClick={downloadTemplate} loading={downloading}>
              Template CSV
            </Button>
          </div>
        </li>

        <li>
          <p className="text-[15px] font-semibold">2. Unggah file CSV</p>
          <p className="mt-0.5 text-sm text-mist-700">Seret file ke area di bawah atau pilih dari perangkat Anda.</p>
          <input ref={inputRef} id="import-csv-file" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          {file ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl p-3.5 ring-1 ring-inset ring-mist-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-50 text-mint-700" aria-hidden>
                <FileSpreadsheet className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{file.name}</p>
                <p className="text-xs text-mist-700">{formatAngka(file.size / 1024, { maxDecimals: 1 })} KB · siap diimpor</p>
              </div>
              {!busy && !result && (
                <button
                  type="button"
                  onClick={reset}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-mist-700 hover:bg-ghost hover:text-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
                  aria-label="Hapus file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <label
              htmlFor="import-csv-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                pick(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                'mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-within:border-cobalt focus-within:ring-2 focus-within:ring-cobalt/30',
                drag ? 'border-cobalt bg-cobalt-50/60' : 'border-mist bg-mist-50 hover:border-mist-500',
              )}
            >
              <CloudUpload className={cn('h-9 w-9', drag ? 'text-cobalt' : 'text-mist-500')} strokeWidth={1.5} aria-hidden />
              <span className="mt-3 text-sm font-semibold text-obsidian">Pilih file atau seret ke sini</span>
              <span className="mt-1 text-xs text-mist-700">Format .csv · maks. 5 MB</span>
              <span className="mt-4 inline-flex h-8 items-center rounded-xl bg-white px-3 text-[13px] font-medium text-obsidian ring-1 ring-inset ring-mist-100" aria-hidden>
                Pilih file
              </span>
            </label>
          )}
        </li>
      </ol>

      {error && <FormAlert className="mt-5">{error}</FormAlert>}

      {result && (
        <div role="status" className="mt-5 flex items-center gap-4 rounded-2xl bg-mint-50 p-4 ring-1 ring-inset ring-mint-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-obsidian">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <p className="text-2xl font-semibold tabular-nums text-obsidian">{formatAngka(result.inserted)} soal</p>
            <p className="text-sm text-mint-700">berhasil diimpor ke bank soal.</p>
          </div>
        </div>
      )}

      {rowErrors && (
        <div className="mt-5">
          <FormAlert title={`${rowErrors.length} baris perlu diperbaiki`}>Perbaiki baris berikut lalu unggah ulang. Tidak ada soal yang disimpan.</FormAlert>
          <TableContainer maxHeight={280} className={cn('mt-3 ring-1 ring-inset ring-mist-100', TABLE_SKIN)}>
            <Table className="min-w-[420px]" dense>
              <THead>
                <Tr>
                  <Th width={90}>Baris</Th>
                  <Th>Pesan</Th>
                </Tr>
              </THead>
              <TBody>
                {rowErrors.map((e, i) => (
                  <Tr key={`${e.row}-${i}`}>
                    <Td mono className="font-semibold text-danger-700">
                      {e.row}
                    </Td>
                    <Td className="text-obsidian-600">{e.message}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </Modal>
  );
}

export default ImportCsvModal;
