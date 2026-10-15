-- GroupChat v2: balas pesan, tag @, reaksi emoji, sematkan (admin), dan pengaturan per fitur
-- (pengaturan disimpan di settings.key='chat_settings', tidak perlu tabel baru).
ALTER TABLE chat_messages ADD COLUMN reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL;
ALTER TABLE chat_messages ADD COLUMN mentions UUID[] NOT NULL DEFAULT '{}';
ALTER TABLE chat_messages ADD COLUMN pinned_at TIMESTAMPTZ;
ALTER TABLE chat_messages ADD COLUMN pinned_by UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_chat_pinned ON chat_messages(pinned_at DESC) WHERE pinned_at IS NOT NULL;
-- mempercepat ON DELETE SET NULL saat janitor menghapus pesan yang pernah dibalas
CREATE INDEX idx_chat_reply_to ON chat_messages(reply_to) WHERE reply_to IS NOT NULL;

-- Satu reaksi per pengguna per pesan (emoji lain = ganti).
CREATE TABLE chat_reactions (
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX idx_chat_reactions_user ON chat_reactions(user_id);
