-- Pesan dari pengunjung halaman utama untuk admin / developer.
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  occupation VARCHAR(20) NOT NULL CHECK (occupation IN ('siswa','mahasiswa','bekerja','belum_bekerja','pengusaha')),
  recipient VARCHAR(10) NOT NULL DEFAULT 'admin' CHECK (recipient IN ('admin','developer')),
  contact VARCHAR(160),
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(is_read) WHERE is_read = false;
