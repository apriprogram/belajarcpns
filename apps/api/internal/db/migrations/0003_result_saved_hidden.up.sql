-- Peserta dapat menyimpan (menandai) hasil atau menghapusnya dari riwayat sendiri.
-- Hapus = sembunyikan (hidden_at), data tetap ada untuk laporan admin & peringkat paket.
ALTER TABLE results ADD COLUMN saved BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE results ADD COLUMN hidden_at TIMESTAMPTZ;
CREATE INDEX idx_results_user_visible ON results(user_id, created_at DESC) WHERE hidden_at IS NULL;
