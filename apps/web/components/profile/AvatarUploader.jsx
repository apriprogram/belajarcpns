'use client';

/* eslint-disable @next/next/no-img-element -- pratinjau lokal & /uploads */
import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { Avatar, Button, ConfirmDialog, useToast } from '@/components/ui';

const MAX = 2 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Bagian "Foto profil" (gaya 123done): pratinjau bulat, Ganti / Hapus, seret & lepas. */
export function AvatarUploader({ user }) {
  const { setUser } = useAuth();
  const toast = useToast();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const upload = async (file) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) {
      toast.error('Format tidak didukung', 'Gunakan foto PNG, JPG, atau WEBP.');
      return;
    }
    if (file.size > MAX) {
      toast.error('Foto terlalu besar', 'Ukuran maksimal 2 MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const me = await api.upload('/me/avatar', fd);
      setUser(me);
      toast.success('Foto profil diperbarui');
    } catch (err) {
      toast.error('Gagal mengunggah foto', errorMessage(err));
    } finally {
      setBusy(false);
      setPreview(null);
    }
  };

  const remove = async () => {
    try {
      const me = await api.del('/me/avatar');
      setUser(me);
      toast.success('Foto profil dihapus');
      return true;
    } catch (err) {
      toast.error('Gagal menghapus foto', errorMessage(err));
      return false;
    }
  };

  const src = preview || user.avatar_url;

  return (
    <section aria-labelledby="judul-foto" className="px-6 py-8 sm:px-10">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          upload(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col-reverse items-start gap-6 rounded-2xl transition-colors sm:flex-row sm:items-center sm:justify-between ${drag ? 'bg-cobalt-50 outline-dashed outline-2 outline-offset-8 outline-cobalt/40' : ''}`}
      >
        <div>
          <h3 id="judul-foto" className="text-xl font-semibold tracking-[-0.02em]">
            Foto profil
          </h3>
          <p className="mt-1 text-sm text-mist-700">Disarankan persegi, minimal 300 × 300. PNG, JPG, atau WEBP maks 2 MB.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" icon={user.avatar_url ? <Camera /> : <ImagePlus />} loading={busy} onClick={() => inputRef.current?.click()}>
              {user.avatar_url ? 'Ganti foto' : 'Unggah foto'}
            </Button>
            {user.avatar_url && (
              <Button variant="secondary" icon={<Trash2 />} disabled={busy} onClick={() => setConfirm(true)} className="text-danger-700">
                Hapus
              </Button>
            )}
          </div>
          <p className="mt-3 text-xs text-mist-500">Atau seret foto ke area ini.</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cobalt/30"
          aria-label="Ganti foto profil"
        >
          {src ? (
            <img src={src} alt={`Foto profil ${user.name}`} className="h-28 w-28 rounded-full object-cover ring-4 ring-ghost sm:h-32 sm:w-32" />
          ) : (
            <Avatar name={user.name} size="xl" className="[&>span]:!h-28 [&>span]:!w-28 [&>span]:!text-3xl [&>span]:!ring-4 [&>span]:!ring-ghost sm:[&>span]:!h-32 sm:[&>span]:!w-32" />
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-obsidian/0 text-white opacity-0 transition group-hover:bg-obsidian/40 group-hover:opacity-100">
            <Camera className="h-6 w-6" />
          </span>
          {busy && <span className="absolute inset-0 animate-pulse rounded-full bg-white/40" aria-hidden />}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={remove}
        tone="danger"
        title="Hapus foto profil?"
        description="Foto akan diganti dengan inisial nama Anda."
        confirmText="Ya, hapus"
        icon={<Trash2 className="h-[22px] w-[22px]" />}
      />
    </section>
  );
}

export default AvatarUploader;
