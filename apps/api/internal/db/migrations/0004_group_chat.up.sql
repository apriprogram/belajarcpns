-- GroupChat: obrolan bersama semua pengguna (peserta & admin).
-- Pesan tanpa bintang dihapus otomatis setelah 7 hari; admin dapat mereset seluruh riwayat.
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL DEFAULT '',
  kind VARCHAR(10) NOT NULL DEFAULT 'text' CHECK (kind IN ('text','image','video','audio','file')),
  file_url TEXT,
  file_name VARCHAR(200),
  file_size BIGINT,
  file_mime VARCHAR(120),
  starred BOOLEAN NOT NULL DEFAULT false,
  starred_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_chat_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_updated ON chat_messages(updated_at);
